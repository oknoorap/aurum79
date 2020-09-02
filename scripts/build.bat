"C:\Program Files\MetaTrader 5\metaeditor64" /compile:"%cd%\..\src\mql\Aurum79.mq5" /log
type "%cd%\..\src\mql\Aurum79.log"
mkdir dist
IF EXIST "%cd%\..\src\mql\Aurum79.ex5" (
  xcopy "%cd%\..\src\mql\Aurum79.ex5" "%cd%\..\dist\Aurum79.ex5" /Y
)
