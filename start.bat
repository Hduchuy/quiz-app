@echo off
chcp 65001 > nul
title Ứng Dụng Ôn Thi Trắc Nghiệm Cá Nhân

echo ========================================================
echo      ỨNG DỤNG ÔN TẬP & THI THỬ TRẮC NGHIỆM CÁ NHÂN
echo ========================================================
echo.

if not exist node_modules (
    echo [1/2] Đang cài đặt thư viện cần thiết lần đầu...
    call npm install
    if errorlevel 1 (
        echo [LỖI] Không thể cài đặt thư viện npm. Vui lòng kiểm tra lại Node.js!
        pause
        exit /b 1
    )
)

echo [2/2] Đang khởi chạy ứng dụng...
echo Ứng dụng sẽ mở tự động trên trình duyệt web của bạn tại:
echo http://localhost:5173
echo.
echo (Nhấn Ctrl + C trong cửa sổ này để tắt ứng dụng khi học xong)
echo.

start "" "http://localhost:5173"
call npm run dev
