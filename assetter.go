package assetter

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"slices"
	"strings"
	
	"github.com/charmbracelet/lipgloss"
)

type Assetter struct {
	EntryPath  string
	ConfigPath string
	PublicPath string
	Styles     []string
	Scripts    []string
	OnBuild    func()
}

const (
	scriptsSuccessMsg   = "<scripts:success>"
	scriptsFailMsg      = "<scripts:fail>"
	stylesSuccessMsg    = "<styles:success>"
	stylesFailMsg       = "<styles:fail>"
	buildErrorMsgPrefix = "Error:"
)

const (
	manifestFilename = "manifest.json"
	scriptsDir       = "scripts"
	stylesDir        = "styles"
	sourcemapSuffix  = ".map"
)

func New(entryPath, configPath, publicPath string) *Assetter {
	a := &Assetter{
		EntryPath:  entryPath,
		ConfigPath: configPath,
		PublicPath: publicPath,
	}
	return a
}

func (a *Assetter) Build() {
	cmd := exec.Command(
		"deno", "run", "--allow-all", fmt.Sprintf("%s/build.ts", a.ConfigPath),
		fmt.Sprintf("--entry-path=%s", a.EntryPath),
		fmt.Sprintf("--config-path=%s", a.ConfigPath),
		fmt.Sprintf("--public-path=%s", a.PublicPath),
	)
	var out bytes.Buffer
	cmd.Stdout = &out
	if err := cmd.Run(); err != nil {
		log.Fatalln(err)
	}
	msgs := strings.Split(out.String(), "\n")
	if slices.Contains(msgs, scriptsSuccessMsg) {
		fmt.Println("Scripts build: " + a.createSuccessMsg())
		a.Scripts = a.readManifest(scriptsDir)
	}
	if slices.Contains(msgs, scriptsFailMsg) {
		fmt.Println("Scripts build: " + a.createFailMsg())
	}
	if slices.Contains(msgs, stylesSuccessMsg) {
		fmt.Println("Styles build: " + a.createSuccessMsg())
		a.Styles = a.readManifest(stylesDir)
	}
	if slices.Contains(msgs, stylesFailMsg) {
		fmt.Println("Styles build: " + a.createFailMsg())
	}
	errorIndex := -1
	for i, msg := range msgs {
		if strings.Contains(msg, buildErrorMsgPrefix) {
			errorIndex = i
		}
		if errorIndex == -1 {
			continue
		}
		fmt.Println(a.createRedColorString(msg))
	}
	if a.OnBuild != nil {
		a.OnBuild()
	}
}

func (a *Assetter) SetEntryPath(entryPath string) *Assetter {
	a.EntryPath = entryPath
	return a
}

func (a *Assetter) SetConfigPath(configPath string) *Assetter {
	a.ConfigPath = configPath
	return a
}

func (a *Assetter) SetPublicPath(publicPath string) *Assetter {
	a.PublicPath = publicPath
	return a
}

func (a *Assetter) readManifest(dir string) []string {
	result := make([]string, 0)
	mb, err := os.ReadFile(fmt.Sprintf("%s/%s/%s", a.PublicPath, dir, manifestFilename))
	if err != nil {
		log.Fatalln(err)
	}
	manifest := make(map[string]string, 0)
	if err := json.Unmarshal(mb, &manifest); err != nil {
		log.Fatalln(err)
	}
	for _, path := range manifest {
		if strings.HasSuffix(path, sourcemapSuffix) {
			continue
		}
		result = append(result, strings.TrimPrefix(path, a.EntryPath))
	}
	return result
}

func (a *Assetter) createSuccessMsg() string {
	return lipgloss.NewStyle().Foreground(lipgloss.Color("#34d399")).Render("SUCCESS")
}

func (a *Assetter) createFailMsg() string {
	return a.createRedColorString("FAIL")
}

func (a *Assetter) createRedColorString(value string) string {
	return lipgloss.NewStyle().Foreground(lipgloss.Color("#ef4444")).Render(value)
}
