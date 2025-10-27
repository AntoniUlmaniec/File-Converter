import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [files, setFiles] = useState(null);
  const [targetFormat, setTargetFormat] = useState('mp4'); // Domyślny format
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!files || files.length === 0) {
      setMessage('Błąd: Nie wybrano plików!');
      return;
    }

    setMessage('Wysyłanie i konwertowanie...');

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('targetFormat', targetFormat);

    try {
      const response = await axios.post('http://localhost:8080/api/convert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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

      setMessage(`Sukces! Pobieranie pliku ${filename} rozpoczęte.`);

    } catch (error) {
      if (error.response && error.response.data) {
        try {
          const errorText = await error.response.data.text();
          setMessage(`Błąd serwera: ${errorText}`);
        } catch (e) {
          setMessage(`Błąd połączenia: ${error.message}`);
        }
      } else {
        setMessage(`Błąd połączenia: ${error.message}`);
      }
      console.error('Błąd podczas wysyłania:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>FileConverter</h1>

        <div>
          <label>1. Wgraj pliki (do 5, max 10MB):</label>
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(e.target.files)}
          />
        </div>

        <div>
          <label>2. Wybierz format:</label>
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
          >
            {/* --- LISTA FORMATÓW --- */}
            <optgroup label="Obraz">
              <option value="jpg">jpg</option>
              <option value="jpeg">jpeg</option>
              <option value="png">png</option>
              <option value="bmp">bmp</option>
            </optgroup>
            <optgroup label="Wideo">
              <option value="mp4">mp4</option>
              <option value="avi">avi</option>
              <option value="mov">mov</option>
              <option value="flv">flv</option>
            </optgroup>
            <optgroup label="Dźwięk">
              <option value="mp3">mp3</option>
              <option value="wav">wav</option>
              <option value="3gg">3gg</option>
              <option value="midi">midi</option>
            </optgroup>
            {/* --- LISTA FORMATÓW --- */}
          </select>
          <button onClick={handleSubmit}>OK (Konwertuj)</button>
        </div>

        {message && (
          <div style={{ marginTop: '20px', padding: '10px', background: 'white', color: 'black', borderRadius: '5px' }}>
            <h3>Status:</h3>
            <p>{message}</p>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;