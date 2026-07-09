'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MonitoringView from '../components/MonitoringView';
import PopulationView from '../components/PopulationView';
import HsiView from '../components/HsiView';
import SecurityView from '../components/SecurityView';
import EnergyView from '../components/EnergyView';
import HealthView from '../components/HealthView';
import AirView from '../components/AirView';
import GrowthView from '../components/GrowthView';

export default function Home() {
  const router = useRouter();
  
  // ============================================
  // GLOBAL STATE MANAGEMENT
  // ============================================
  const [telemetry, setTelemetry] = useState(null);
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [activeTab, setActiveTab] = useState('monitoring'); // 'monitoring', 'populasi', 'growth', 'health', 'air', 'hsi', 'security', 'energy'
  const [isFetching, setIsFetching] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Ambil sesi user yang sedang aktif
  const checkUserSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) throw new Error("Sesi tidak valid");
      const data = await res.json();
      if (data.status === 'ok') {
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error("Auth check failed, redirecting:", error);
      router.push('/login');
    }
  };

  // Fetch data telemetry dan config settings
  const fetchData = async (isInitial = false) => {
    try {
      if (isInitial) setIsFetching(true);
      const res = await fetch('/api/telemetry?limit=25');
      if (!res.ok) throw new Error("Gagal mengambil data");
      
      const data = await res.json();
      if (data.status === 'ok') {
        setSettings(data.settings);
        setHistory(data.history);
        
        if (data.history.length > 0) {
          const latest = data.history[data.history.length - 1];
          setTelemetry(latest);
        }
        setIsConnected(true);
      }
    } catch (error) {
      console.error("Error fetching telemetry:", error);
      setIsConnected(false);
    } finally {
      if (isInitial) setIsFetching(false);
    }
  };

  useEffect(() => {
    checkUserSession();
    fetchData(true);
    
    const interval = setInterval(() => {
      fetchData(false);
    }, 3500);
    
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error("Gagal melakukan logout:", error);
    }
  };

  // Update Settings ke API
  const handleUpdateSettings = async (newSettings) => {
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (!res.ok) throw new Error("Gagal menyimpan setting");
      
      const data = await res.json();
      if (data.status === 'ok') {
        setSettings(data.settings);
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 3000);
        fetchData(false);
      }
    } catch (error) {
      alert("Error saving settings: " + error.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // ============================================
  // EVALUASI ALARM NIGHT SECURITY & PREDATOR
  // ============================================
  const getIsNightAlertActive = () => {
    if (!telemetry) return false;
    
    // Mengecek apakah telemetri terdeteksi pada jam malam (19:00 - 05:00)
    const dateObj = new Date(telemetry.timestamp);
    const hour = dateObj.getHours();
    const isNight = hour >= 19 || hour < 5;
    
    // Bahaya malam jika terdeteksi gerakan PIR
    return isNight && telemetry.gerakan;
  };

  const isNightAlertActive = getIsNightAlertActive();

  // ============================================
  // EVALUASI ALARM DARURAT: POTENSI KEMATIAN MASSAL
  // ============================================
  const getIsMassMortalityAlert = () => {
    if (!history || history.length < 8) return false;

    // Filter record siang hari (pukul 05:00 s/d 19:00) dari history terbaru
    const daytimeRecords = history.filter(item => {
      const dateObj = new Date(item.timestamp);
      const hour = dateObj.getHours();
      return hour >= 5 && hour < 19;
    });

    // Ambil maksimal 10 record siang hari terbaru
    const recentDaytime = daytimeRecords.slice(-10);

    // Aktifkan alarm jika minimal ada 5 record siang hari berturut-turut,
    // dan seluruhnya memiliki gerakan = false (tidak bergerak sama sekali)
    if (recentDaytime.length >= 5 && recentDaytime.every(item => !item.gerakan)) {
      return true;
    }

    return false;
  };

  const isMassMortalityAlert = getIsMassMortalityAlert();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800">
      
      {/* CUSTOM PREMIUM SCROLLBAR STYLING */}
      <style>{`
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(13, 148, 136, 0.2);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(13, 148, 136, 0.6);
        }
      `}</style>
      
      {/* SIDEBAR COMPONENT */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-hidden">
        
        {/* HEADER COMPONENT */}
        <Header 
          activeTab={activeTab}
          isConnected={isConnected}
          isFetching={isFetching}
          onRefresh={() => fetchData(false)}
        />

        {/* TOAST SUCCESS SAVE */}
        {showSaveToast && (
          <div className="fixed bottom-4 right-4 z-50 bg-teal-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2 border border-teal-500 transition-all animate-bounce">
            <CheckCircle className="w-4.5 h-4.5" />
            <span className="text-xs font-bold">Data berhasil disimpan & diterapkan!</span>
          </div>
        )}

        {/* MAIN BODY VIEW ORCHESTRATION - FLOATING CARD LAYOUT */}
        <main className="flex-1 mx-5 md:ml-4 mb-5 p-6 md:p-8 bg-white/70 backdrop-blur-sm rounded-[32px_12px_32px_12px] border border-slate-150/40 shadow-[0_8px_30px_rgba(0,0,0,0.015)] overflow-y-auto">
          {activeTab === 'monitoring' && (
            <MonitoringView 
              telemetry={telemetry}
              settings={settings}
              history={history}
              isSavingSettings={isSavingSettings}
              onUpdateSettings={handleUpdateSettings}
              isNightAlertActive={isNightAlertActive}
              isMassMortalityAlert={isMassMortalityAlert}
            />
          )}
          {activeTab === 'populasi' && (
            <PopulationView 
              settings={settings}
              isSavingSettings={isSavingSettings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}
          {activeTab === 'growth' && (
            <GrowthView 
              settings={settings}
              history={history}
            />
          )}
          {activeTab === 'health' && (
            <HealthView 
              telemetry={telemetry}
              settings={settings}
              history={history}
              isMassMortalityAlert={isMassMortalityAlert}
            />
          )}
          {activeTab === 'air' && (
            <AirView 
              telemetry={telemetry}
              history={history}
            />
          )}
          {activeTab === 'hsi' && (
            <HsiView 
              telemetry={telemetry}
              history={history}
            />
          )}
          {activeTab === 'security' && (
            <SecurityView 
              telemetry={telemetry}
              settings={settings}
              history={history}
              isSavingSettings={isSavingSettings}
              onUpdateSettings={handleUpdateSettings}
              isNightAlertActive={isNightAlertActive}
            />
          )}
          {activeTab === 'energy' && (
            <EnergyView 
              history={history}
            />
          )}
        </main>
      </div>

    </div>
  );
}
