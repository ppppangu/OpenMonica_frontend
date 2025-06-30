import React from 'react'
import yaml from 'js-yaml'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import ChatPage from './pages/ChatPage'
import KnowledgeBasePage from './pages/KnowledgeBasePage'
import SettingsPage from './pages/SettingsPage'
import HelpPage from './pages/HelpPage'
import CustomPage from './pages/CustomPage'
import MainLayout from './components/layout/MainLayout'
import ReactAppTest from './test-samples/ReactAppTest'

function App() {
  const { isAuthenticated, user } = useAuth()

  console.log('App.tsx - Auth state:', { isAuthenticated, user: user?.id })

  // 加载 config.yaml 并注入全局变量，便于其他模块同步读取
  React.useEffect(() => {
    fetch('/config.yaml')
      .then(res => res.text())
      .then(text => {
        try {
          const data: any = yaml.load(text)
          ;(window as any).__APP_CONFIG = data || {}
        } catch (e) {
          console.warn('解析 config.yaml 失败', e)
        }
      })
      .catch(err => console.warn('加载 config.yaml 失败', err))
  }, [])

  // Protected route wrapper
  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    console.log('ProtectedRoute - Auth check:', { isAuthenticated, hasUser: !!user })

    if (!isAuthenticated || !user) {
      console.log('ProtectedRoute - Redirecting to login')
      return <Navigate to="/login" replace />
    }

    console.log('ProtectedRoute - Access granted')
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        
        {/* Protected routes with main layout */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/chat" replace />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/knowledge" element={<KnowledgeBasePage />} />
                  <Route path="/custom" element={<CustomPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/test" element={<ReactAppTest />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App
