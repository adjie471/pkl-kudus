'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ZoomIn, ZoomOut, Zap } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

export default function QRScanner({ onScanSuccess }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    const scannerId = 'qr-reader-container';
    const html5QrCode = new Html5Qrcode(scannerId);
    scannerRef.current = html5QrCode;

    const startCamera = async () => {
      try {
        setCameraError(null);
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              // Menghitung ukuran kotak fokus scan
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const calculatedEdge = Math.floor(minEdge * 0.85);
              // Kunci minimal 150px agar tidak pernah di bawah 50px (mencegah crash)
              const edgeSize = Math.max(150, calculatedEdge);
              return { width: edgeSize, height: edgeSize };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Pembersihan Otomatis: Jika hasil scan berupa URL, ambil hanya ID Unik paling akhir (misal: CFD-96127)
            let cleanIdUnik = decodedText ? decodedText.trim() : '';
            if (cleanIdUnik.includes('/')) {
              const parts = cleanIdUnik.split('/');
              cleanIdUnik = parts[parts.length - 1];
            }

            onScanSuccess(cleanIdUnik);
          },
          () => {}
        );

        setIsScanning(true);

        // Cek dukungan Fitur Zoom & Flash/Torch pada Hardware HP
        setTimeout(() => {
          try {
            const capabilities = html5QrCode.getRunningTrackCapabilities() as any;
            if (capabilities?.torch) setHasTorch(true);
          } catch (e) {
            console.log('Capabilities not supported:', e);
          }
        }, 1000);
      } catch (err: any) {
        setCameraError('Gagal membuka kamera. Pastikan kamera tidak dipakai aplikasi lain.');
      }
    };

    startCamera();

    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current
            .stop()
            .then(() => {
              scannerRef.current?.clear();
            })
            .catch((e) => console.log('Scanner stop silent error:', e));
        } else {
          try {
            scannerRef.current.clear();
          } catch (e) {}
        }
      }
    };
  }, []);

  // Handler Zoom Kamera Digital
  const handleZoomChange = async (newZoom: number) => {
    setZoomLevel(newZoom);
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ zoom: newZoom } as any],
        });
      } catch (e) {
        console.log('Zoom constraint error:', e);
      }
    }
  };

  // Handler Lampu Flash / Torch
  const toggleTorch = async () => {
    if (scannerRef.current && isScanning) {
      try {
        const nextState = !torchOn;
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: nextState } as any],
        });
        setTorchOn(nextState);
      } catch (e) {
        console.log('Torch constraint error:', e);
      }
    }
  };

  return (
    <div className="space-y-3">
      {cameraError ? (
        <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl text-xs border border-rose-200 text-center font-semibold">
          {cameraError}
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-teal-500 shadow-inner">
          {/* Container Kamera Layar Besar */}
          <div id="qr-reader-container" className="w-full h-72 sm:h-80" />

          {/* Kontrol Floating Zoom & Flash */}
          {isScanning && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-slate-900/80 backdrop-blur-md p-2 rounded-xl text-white text-xs border border-white/20 z-10">
              {/* Tombol Control Zoom */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleZoomChange(Math.max(1, zoomLevel - 0.5))}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono font-bold text-[11px] px-1">{zoomLevel.toFixed(1)}x</span>
                <button
                  type="button"
                  onClick={() => handleZoomChange(Math.min(4, zoomLevel + 0.5))}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Tombol Flash Kamera */}
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 text-[11px] transition-all ${
                    torchOn ? 'bg-amber-400 text-slate-900 shadow-lg' : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" /> {torchOn ? 'Senter ON' : 'Senter OFF'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-slate-500 text-center font-medium">
        Gunakan tombol <b className="text-teal-700">Zoom (1.5x - 2x)</b> jika QR Code pada kartu pedagang terlihat kecil.
      </p>
    </div>
  );
}