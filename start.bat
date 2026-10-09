@echo off
setlocal
rem Starts the TailorTrack backend (FastAPI :8100) and frontend (Next.js :3000)
rem in their own windows. Close those windows to stop the servers.

set "ROOT=%~dp0"

rem No backend\.env -> fall back to the local SQLite database instead of PostgreSQL
if not exist "%ROOT%backend\.env" (
    echo backend\.env not found - using SQLite ^(backend\dev.db^)
    set "DATABASE_URL=sqlite:///./dev.db"
)

if not exist "%ROOT%frontend\node_modules" (
    echo Installing frontend dependencies...
    pushd "%ROOT%frontend"
    call npm install || (popd & echo npm install failed & pause & exit /b 1)
    popd
)

echo Applying database migrations...
pushd "%ROOT%backend"
python -m alembic upgrade head || (popd & echo Migrations failed & pause & exit /b 1)
popd

start "TailorTrack Backend" /D "%ROOT%backend" cmd /k python -m uvicorn app.main:app --reload --port 8100
start "TailorTrack Frontend" /D "%ROOT%frontend" cmd /k npm run dev

echo.
echo Backend:  http://localhost:8100/docs
echo Frontend: http://localhost:3000
timeout /t 6 /nobreak >nul
start "" http://localhost:3000
endlocal
