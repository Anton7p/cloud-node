@echo off
chcp 65001 >nul
REM Полный локальный тест обоих playbooks

cd /d "C:\Users\User\Desktop\cloudnode\ansible"

echo ==========================================
echo === ТЕСТ: deploy_app.yml (MASTER) ===
echo ==========================================

set ANSIBLE_TRANSPORT=paramiko

ansible-playbook -i inventory.local.ini deploy_app.yml --check -v ^
  -e "server_ip=62.60.229.227" ^
  -e "domain_name=test.example.com" ^
  -e "marzban_username=admin" ^
  -e "marzban_password=adminpass" ^
  -e "image_name=ghcr.io/anton7p/cloud-node:test"

echo.
echo ==========================================
echo === ТЕСТ: deploy_node.yml (NODE) ===
echo ==========================================

ansible-playbook -i inventory.local.ini deploy_node.yml --check -v ^
  -e "master_server_address=62.60.229.227" ^
  -e "domain_name=test.example.com" ^
  -e "marzban_username=admin" ^
  -e "marzban_password=adminpass"

echo.
echo ==========================================
echo Тест завершен!
echo Для реального deploy убери --check
echo ==========================================
pause
