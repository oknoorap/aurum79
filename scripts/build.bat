"C:\Program Files\MetaTrader 5\metaeditor64" /compile:"%cd%\..\src\mql\Aurum79.mq5" /log
type "%cd%\..\src\mql\Aurum79.log"
mkdir dist\ea
IF EXIST "%cd%\..\src\mql\Aurum79.ex5" (
  echo f | xcopy /f /y "%cd%\..\src\mql\Aurum79.ex5" "%cd%\..\dist\ea\Aurum79.ex5"
)
