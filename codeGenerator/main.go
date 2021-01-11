package main

import (
	"bytes"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"html/template"
	"io/ioutil"
	"log"
	"net/smtp"
	"strconv"
	"strings"

	mail "github.com/xhit/go-simple-mail"
)

// 1. 邮箱列表文件
// 2. 生成验证码，发送邮箱
// 3. 保存邮箱、哈希表

type VerifyInfo struct {
	email string
	code  []byte
	hash  []byte
}

func (v VerifyInfo) String() string {
	str := fmt.Sprintf("%v,%v,0x%x\n", v.email, string(v.code), v.hash)
	return str
}

func main() {
	emails := readEmails()
	senderEmailConfig := readSenderEmailConfig()
	verifyInfos := genVerifyCodes(emails)
	// sendEmails(senderEmailConfig, verifyInfos)
	// return
	sendEmails2(senderEmailConfig, verifyInfos)

}

func readEmails() []string {
	content, err := ioutil.ReadFile(recieverEmailsPath)
	OsExitIfErr(err, "failed to read emails file")
	str := strings.ReplaceAll(string(content), "\r", "")
	emails := strings.Split(str, "\n")
	Logf("====Read emails================\nLength:%v\n", len(emails))
	return emails
}

func readSenderEmailConfig() map[string]string {
	content, err := ioutil.ReadFile(fromEmailConfigPath)
	OsExitIfErr(err, "failed to read sender email config")
	senderConfig := make(map[string]string)
	json.Unmarshal(content, &senderConfig)
	return senderConfig
}

func genVerifyCodes(emails []string) []VerifyInfo {
	verifyInfos := make([]VerifyInfo, len(emails))
	for i, v := range emails {
		code := randCode()
		hash := Keccak256(code)
		info := VerifyInfo{
			email: v,
			code:  code,
			hash:  hash,
		}
		verifyInfos[i] = info
	}
	Log("===Create codes and hashes=====\nEmail    Hash\n")
	for _, v := range verifyInfos {
		// fmt.Printf("%s\t%s\t0x%x\n", v.email, v.code, v.hash)
		// fmt.Printf("%s\t0x%x\n", v.email, v.hash)
		// Log(fmt.Sprintf("%s\t0x%x\n", v.email, v.hash))
		Logf(fmt.Sprintf("%s    0x%x\n", v.email, v.hash))
	}
	Log("===Send emials=================\n")
	return verifyInfos
}

func randCode() []byte {
	codeLen := make([]byte, 1)
	rand.Read(codeLen)
	code := make([]byte, codeLen[0]%8+10)
	rand.Read(code)

	OPTCHARSLen := byte(len(OPTCHARS))
	for i, v := range code {
		code[i] = OPTCHARS[v%OPTCHARSLen]
	}
	return code
}

func sendEmails(senderConfig map[string]string, infos []VerifyInfo) {

	from := senderConfig["from"]
	password := senderConfig["password"]
	smtpHost := senderConfig["smtpHost"]
	smtpPort := senderConfig["smtpPort"]

	auth := smtp.PlainAuth("lucky draw test", from, password, smtpHost)

	mimeHeaders := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	t, _ := template.ParseFiles(webTemplatePath)

	for _, v := range infos {
		var body bytes.Buffer

		body.Write([]byte(fmt.Sprintf("Subject: Conflux Annual Meeting Vrify Code\n%s\n\n", mimeHeaders)))

		t.Execute(&body, struct {
			Code string
		}{
			Code: string(v.code),
		})

		// Sending email.
		err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{v.email}, body.Bytes())
		if err != nil {
			Logf("failed to send mail.%v", err.Error())
			return
		}
		Logf("Send %v done!\n", v.email)
	}
	Log("===Send all done!==============\n\n")
}

func sendEmails2(senderConfig map[string]string, infos []VerifyInfo) {
	server := mail.NewSMTPClient()

	from := senderConfig["from"]
	password := senderConfig["password"]
	smtpHost := senderConfig["smtpHost"]
	smtpPort := senderConfig["smtpPort"]
	nickName := senderConfig["nickName"]

	// SMTP Server
	server.Host = smtpHost
	server.Port, _ = strconv.Atoi(smtpPort)
	server.Username = from
	server.Password = password

	server.Encryption = mail.EncryptionTLS
	//Set your smtpClient struct to keep alive connection
	server.KeepAlive = true
	// SMTP client
	smtpClient, err := server.Connect()
	if err != nil {
		log.Fatal(err)
	}

	t, _ := template.ParseFiles(webTemplatePath)

	for _, v := range infos {
		var body bytes.Buffer
		// body.Write([]byte(fmt.Sprintf("Subject: Conflux Annual Meeting Vrify Code\n%s\n\n", mimeHeaders)))

		t.Execute(&body, struct {
			Code string
		}{
			Code: string(v.code),
		})

		// New email simple html with inline and CC
		email := mail.NewMSG()
		email.SetFrom(fmt.Sprintf("%v<%v>", nickName, server.Username)).
			AddTo(v.email).
			SetSubject("Conflux Annual Meeting Vrify Code")

		email.SetBody(mail.TextHTML, body.String())
		// email.AddInline("/path/to/image.png", "Gopher.png")

		// Call Send and pass the client
		err = email.Send(smtpClient)
		if err != nil {
			log.Fatalln(err)
		} else {
			Logf("Send %v done!\n", v.email)
		}
	}
	Log("===Send all done!==============\n\n")
}
