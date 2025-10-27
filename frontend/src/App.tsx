import React, { useState } from 'react';
import axios from 'axios'; // Importujemy axios
import './App.css';

function App() {
  // Stany do przechowywania danych z formularza
  const [files, setFiles] = useState(null); // Stan na pliki
  const [targetFormat, setTargetFormat] = useState('mp4'); // Stan na format
  const [message, setMessage] = useState(''); // Stan na odpowiedź z serwera

  // Funkcja wywoływana przyciskiem "Konwertuj"
  const handleSubmit = async () => {
    if (!files || files.length === 0) {
      setMessage('Błąd: Nie wybrano plików!');
      return;
    }

    setMessage('Wysyłanie...');

    // 1. Tworzymy obiekt FormData (specjalny do wysyłania plików)
    const formData = new FormData();

    // 2. Dodajemy wszystkie wybrane pliki
    // Musimy użyć pętli, bo backend oczekuje tablicy @RequestParam("files")
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    // 3. Dodajemy format docelowy
    formData.append('targetFormat', targetFormat);

    // 4. Wysyłamy!
    try {
      // WAŻNE: Adres musi pasować do twojego backendu (port 8080)
      const response = await axios.post('http://localhost:8080/api/convert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Mówimy serwerowi, że wysyłamy pliki
        },
      });

      // Sukces! Wyświetlamy odpowiedź z serwera
      setMessage(`Serwer odpowiedział: ${response.data}`);

    } catch (error) {
      // Porażka :(
      console.error('Błąd podczas wysyłania:', error);
      setMessage(`Błąd połączenia z backendem: ${error.message}`);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>MediaFlex Konwerter</h1>

        {/* 1. Komponent do wgrywania plików */}
        <div>
          <label>1. Wgraj pliki (do 5):</label>
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(e.target.files)} // Zapisujemy pliki do stanu
          />
        </div>

        {/* 2. Komponent do wyboru formatu i wysyłki */}
        <div>
          <label>2. Wybierz format:</label>
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)} // Zapisujemy format do stanu
          >
            <option value="mp4">mp4 (Wideo)</option>
            <option value="mp3">mp3 (Audio)</option>
            <option value="png">png (Obraz)</option>
          </select>
          <button onClick={handleSubmit}>OK (Konwertuj)</button>
        </div>

        {/* 3. Miejsce na odpowiedź z serwera */}
        {message && (
          <div style={{ marginTop: '20px', padding: '10px', background: 'white', color: 'black' }}>
            <h3>Status:</h3>
            <p>{message}</p>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;