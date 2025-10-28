import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import logo from './assets/logo.png';
import animation from './assets/animation.gif';

function Notification({ message, type }) {
  if (!message) return null;
  return (
    <div className={`notification ${type}`}>
      {message}
    </div>
  );
}

function App() {
  const [files, setFiles] = useState(null);
  const [targetFormat, setTargetFormat] = useState('mp4');
  const [isConverting, setIsConverting] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const getFileNames = () => {
    if (!files) return "Nie wybrano plików";
    // Bierzemy wszystkie nazwy i łączymy je przecinkiem
    return Array.from(files).map(file => file.name).join(', ');
  };

  const handleSubmit = async () => {
    if (!files || files.length === 0) {
      showNotification('Błąd: Nie wybrano plików!', 'error');
      return;
    }

    setIsConverting(true);
    setNotification(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('targetFormat', targetFormat);

    try {
      const response = await axios.post('http://localhost:8080/api/convert', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
      });

      const header = response.headers['content-disposition'];
      const filename = header ? header.split('filename="')[1].replace('"', '') : 'converted_file';

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      showNotification('Sukces! Konwersja zakończona, pobieranie rozpoczęte.', 'success');

    } catch (error) {
      if (error.response && error.response.data) {
        try {
          const errorText = await error.response.data.text();
          showNotification(`Błąd serwera: ${errorText}`, 'error');
        } catch (e) {
          showNotification(`Błąd połączenia: ${error.message}`, 'error');
        }
      } else {
        showNotification(`Błąd połączenia: ${error.message}`);
      }
      console.error('Błąd podczas wysyłania:', error);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <>
      <Notification
        message={notification?.message}
        type={notification?.type}
      />

      <div className="container">

        <header className="header">
          <div className="logo-container">
            <img src={logo} alt="Logo" className="logo" />
          </div>
          <div className="animation-container">
            <img src={animation} alt="Animacja" className="animation" />
          </div>
        </header>

        <main className="main-content">
          <h1>FileConverter</h1>

          <div className="converter-controls">

            <div className="control-row">
              <span className="label">UPLOAD</span>

              <label htmlFor="upload-input" className="file-input-label">
                Wybierz pliki
              </label>

              <input
                id="upload-input"
                className="file-input-hidden"
                type="file"
                multiple
                onChange={(e) => setFiles(e.target.files)}
              />
              <span className="file-names">{getFileNames()}</span>
            </div>

            <div className="control-row">
              <span className="label">CONVERT TO</span>
              <select
                id="convert-select"
                className="convert-select"
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value)}
              >
                <optgroup label="Obraz">
                  <option value="jpg">jpg</option><option value="jpeg">jpeg</option><option value="png">png</option><option value="bmp">bmp</option>
                </optgroup>
                <optgroup label="Wideo">
                  <option value="mp4">mp4</option><option value="avi">avi</option><option value="mov">mov</option><option value="flv">flv</option>
                </optgroup>
                <optgroup label="Dźwięk">
                  <option value="mp3">mp3</option><option value="wav">wav</option><option value="3gp">3gp</option><option value="midi">midi</option>
                </optgroup>
              </select>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isConverting}
              className="submit-button"
            >
              {isConverting ? 'PRZETWARZANIE...' : 'OK'}
            </button>
          </div>

          {isConverting && (
            <div className="progress-bar-container">
              <div className="progress-bar"></div>
              <span>Przetwarzanie...</span>
            </div>
          )}
        </main>

        <footer className="footer">
          MIEJSCE NA TWÓJ BANER REKLAMOWY!!! TEL: 555 666 777
        </footer>
      </div>
    </>
  );
}

export default App;