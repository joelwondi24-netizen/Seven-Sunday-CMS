import React, { useState } from 'react';
import { Check, Copy, Download, FolderArchive, Laptop, MonitorDown, Terminal, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface WindowsDesktopSetupPanelProps {
  compact?: boolean;
}

export const WindowsDesktopSetupPanel: React.FC<WindowsDesktopSetupPanelProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [downloading, setDownloading] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const buildCommand = 'npm run desktop:win';

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(buildCommand);
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleDownloadKit = async () => {
    setErrorMsg('');
    setDownloading(true);
    try {
      const resp = await fetch('/api/desktop/windows-kit.zip');
      if (!resp.ok) {
        throw new Error(`Download failed (${resp.status})`);
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SevenSunday-Windows-Desktop-Kit.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to download Windows setup kit.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={compact ? 'space-y-4 text-xs' : 'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 text-xs'}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#082B59] text-white flex items-center justify-center shrink-0">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#15243A] dark:text-white">
              Windows Desktop (.exe) Installer & Setup Kit
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Native Electron Windows packaging with NSIS Setup Wizard, Portable .exe target, multi-resolution Windows icon, and embedded %APPDATA% offline database.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-lg bg-[#F5F8FC] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="font-semibold text-[#082B59] dark:text-white">1. NSIS Windows Setup Wizard (.exe)</div>
          <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
            Seven-Sunday-Ethiopia-ERP-Setup-1.0.0-x64.exe
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Creates Start Menu & Desktop shortcuts, custom install folder, and Add/Remove Programs uninstaller.
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#F5F8FC] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="font-semibold text-[#082B59] dark:text-white">2. Portable Standalone (.exe)</div>
          <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
            Seven-Sunday-Ethiopia-ERP-Portable-1.0.0-x64.exe
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Zero-install single executable storing offline ERP records in %APPDATA% with full IndexedDB sync.
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          disabled={downloading}
          onClick={() => void handleDownloadKit()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#082B59] hover:bg-[#0D3D7A] disabled:opacity-60 text-white font-medium cursor-pointer whitespace-nowrap"
        >
          <FolderArchive className="w-3.5 h-3.5" />
          <span>{downloading ? 'Packaging ZIP...' : 'Download Windows Setup Kit (.zip)'}</span>
        </button>

        {isInstallable && !isInstalled && (
          <button
            type="button"
            onClick={() => void install()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1178B9] hover:bg-[#0D6096] text-white font-medium cursor-pointer whitespace-nowrap"
          >
            <MonitorDown className="w-3.5 h-3.5" />
            <span>Install Windows App Now (Edge / Chrome)</span>
          </button>
        )}

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-[11px]">
          <Terminal className="w-3.5 h-3.5 text-[#087CEB]" />
          <span>{buildCommand}</span>
          <button
            type="button"
            onClick={() => void handleCopyCommand()}
            className="text-slate-400 hover:text-[#087CEB] cursor-pointer"
            title="Copy Windows build command"
          >
            {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        Extract the downloaded kit on Windows 10/11 and double-click <code className="font-mono text-[#082B59] dark:text-slate-200">Setup-SevenSunday-Windows.bat</code> (requires Node.js 20+), or run <code className="font-mono text-[#082B59] dark:text-slate-200">npm run desktop:win</code> from the project root / trigger the included GitHub Actions Windows workflow to compile both signed-ready <code className="font-mono">.exe</code> installers into <code className="font-mono">dist-electron/</code>.
      </div>

      {errorMsg && <div className="text-red-600 font-medium">{errorMsg}</div>}
    </div>
  );
};

interface WindowsDesktopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsDesktopModal: React.FC<WindowsDesktopModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 no-print"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Windows Desktop Setup"
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#15243A] dark:text-white">
            <Download className="w-4 h-4 text-[#087CEB]" />
            <span>Desktop Packaging & Windows (.exe) Setup</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <WindowsDesktopSetupPanel compact />
      </div>
    </div>
  );
};
