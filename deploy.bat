@echo off
cd /d "C:\Users\prota\OneDrive\Desktop\Ero Musa 2\eromusa-app"
echo Iniciando commit e push...
git add -A
git commit -m "Add storage bucket migration and improve error message for image upload"
git push origin master
echo COMMIT_E_PUSH_FEITOS
pause
