package main

import (
	"fmt"
	"os"
	"path"

	"golang.org/x/crypto/sha3"
)

var logFile *os.File
var (
	currentDir          string
	logPath             string
	recieverEmailsPath  string
	fromEmailConfigPath string
	webTemplatePath     string
)

func init() {
	// _, filename, _, ok := runtime.Caller(0)
	// if !ok {
	// 	panic("get current file path error")
	// }
	// currentDir = path.Join(filename, "../")
	currentDir = "./"
	logPath = path.Join(currentDir, "log.txt")
	recieverEmailsPath = path.Join(currentDir, "1_填写员工邮箱.csv")
	fromEmailConfigPath = path.Join(currentDir, "2_填写你的邮箱配置.json")
	webTemplatePath = path.Join(currentDir, "3_编制文案模板template.html")

	var err error
	logFile, err = os.OpenFile(logPath, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0777)
	OsExitIfErr(err, "failed to open file log.txt")

	Log("====Configs==========\n")
	Logf("currentDir: %v\nlogPath:%v\nrecieverEmailsPath:%v\nfromEmailConfigPath:%v\nwebTemplatePath:%v\n", currentDir, logPath, recieverEmailsPath, fromEmailConfigPath, webTemplatePath)

}

// OsExitIfErr prints error msg and exit
func OsExitIfErr(err error, format string, a ...interface{}) {
	if err != nil {
		Log(fmt.Sprintf(format, a...))
		Log(fmt.Sprintf("--- error: %v\n", err))
		os.Exit(1)
	}
}

// Keccak256 calculates and returns the Keccak256 hash of the input data.
func Keccak256(data ...[]byte) []byte {
	d := sha3.NewLegacyKeccak256()
	for _, b := range data {
		d.Write(b)
	}
	return d.Sum(nil)
}

// Log msg
func Log(msg string) {
	fmt.Print(msg)
	_, err := logFile.WriteString(msg)
	if err != nil {
		fmt.Printf("failed to write '%v' to log file: %v\n", msg, err.Error())
	}
}

func Logf(format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	Log(msg)
}

// OPTCHARS Elements
const OPTCHARS string = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
