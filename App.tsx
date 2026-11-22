import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  const [cityQuery, setCityQuery] = useState('');
  const [latitude, setLatitude] = useState('-23.2642');
  const [longitude, setLongitude] = useState('-47.2992');
  const [locationName, setLocationName] = useState('Itu - SP');

  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getWeatherInfo(code: number) {
    if (code == 0) {
      return {
        description: 'Céu Limpo',
        icon: <Ionicons name="sunny" size={50} color="#ffc936" />,
      };
    }
    if ([1, 2].includes(code)) {
      return {
        description: 'Parcialmente Nublado',
        icon: <Ionicons name="partly-sunny" size={50} color="#ffc936" />,
      };
    }
    if (code == 3) {
      return {
        description: 'Nublado',
        icon: <Ionicons name="cloudy" size={50} color="#d1d5db" />,
      };
    }
    if ([45, 48].includes(code)) {
      return {
        description: 'Neblina',
        icon: <Ionicons name="cloud" size={50} color="#9ca3af" />,
      };
    }
    if ([51, 53, 55, 56, 57].includes(code)) {
      return {
        description: 'Garoa',
        icon: <Ionicons name="rainy" size={50} color="#60a5fa" />,
      };
    }
    if ([61, 63, 65, 66, 67].includes(code)) {
      return {
        description: 'Chuva',
        icon: <Ionicons name="rainy" size={50} color="#60a5fa" />,
      };
    }
    if ([71, 73, 75, 77].includes(code)) {
      return {
        description: 'Neve',
        icon: <Ionicons name="snow" size={50} color="#ffffff" />,
      };
    }
    if ([80, 81, 82].includes(code)) {
      return {
        description: 'Pancadas de Chuva',
        icon: <Ionicons name="rainy" size={50} color="#60a5fa" />,
      };
    }
    if ([85, 86].includes(code)) {
      return {
        description: 'Pancadas de Neve',
        icon: <Ionicons name="snow" size={50} color="#ffffff" />,
      };
    }
    if (code == 95) {
      return {
        description: 'Tempestade',
        icon: <Ionicons name="thunderstorm" size={50} color="#facc15" />,
      };
    }
    if ([96, 99].includes(code)) {
      return {
        description: 'Tempestade com Granizo',
        icon: <Ionicons name="thunderstorm" size={50} color="#facc15" />,
      };
    }

    return {
      description: 'Condição Variável',
      icon: <Ionicons name="partly-sunny" size={50} color="#ffffff" />,
    };
  }

  async function fetchLocationName(lat: string, lon: string) {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
          lat
        )}&longitude=${encodeURIComponent(lon)}&localityLanguage=pt`
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar localização');
      }

      const data = await response.json();
      const city =
        data.city ||
        data.locality ||
        data.principalSubdivision ||
        'Localização desconhecida';
      const region = data.principalSubdivisionCode
        ? ` - ${data.principalSubdivisionCode.replace('BR-', '')}`
        : '';

      setLocationName(`${city}${region}`);
    } catch {
      setLocationName('Localização não encontrada');
    }
  }

  async function fetchWeatherByCoords(lat: string, lon: string) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
      lat
    )}&longitude=${encodeURIComponent(
      lon
    )}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=America%2FSao_Paulo`;

    const result = await fetch(url);
    if (!result.ok) {
      throw new Error('Erro ao consultar a API');
    }

    const data = await result.json();
    console.log(data);
    setWeather(data.current);
  }

  async function searchByCity() {
    const nomeCidade = cityQuery.trim();

    if (!nomeCidade) {
      setError('Digite o nome de uma cidade.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          nomeCidade
        )}&count=1&language=pt&format=json`
      );

      if (!geoResponse.ok) {
        throw new Error('Erro ao buscar a cidade');
      }

      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        setError('Cidade não encontrada.');
        return;
      }

      const place = geoData.results[0];
      const latEncontrada = String(place.latitude);
      const lonEncontrada = String(place.longitude);

      setLatitude(latEncontrada);
      setLongitude(lonEncontrada);
      setLocationName(
        `${place.name}${place.admin1 ? ` - ${place.admin1}` : ''}`
      );

      await fetchWeatherByCoords(latEncontrada, lonEncontrada);
    } catch {
      setError('Não foi possível buscar os dados da cidade.');
    } finally {
      setLoading(false);
    }
  }

  async function searchWeather() {
    const latFormatada = latitude.trim().replace(',', '.');
    const lonFormatada = longitude.trim().replace(',', '.');

    if (
      !latFormatada ||
      !lonFormatada ||
      isNaN(Number(latFormatada)) ||
      isNaN(Number(lonFormatada))
    ) {
      setError('Informe valores válidos de latitude e longitude.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchWeatherByCoords(latFormatada, lonFormatada),
        fetchLocationName(latFormatada, lonFormatada),
      ]);
    } catch (error) {
      setError('Não foi possível obter os dados.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    searchWeather();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weather-App</Text>
      <Text style={styles.city}>{locationName}</Text>

      <View style={styles.citySearchBox}>
        <Text style={styles.inputLabel}>Buscar por cidade</Text>
        <View style={styles.citySearchRow}>
          <TextInput
            style={[styles.input, styles.cityInput]}
            value={cityQuery}
            onChangeText={setCityQuery}
            placeholder="Ex.: São Paulo"
            placeholderTextColor="#64748b"
            onSubmitEditing={searchByCity}
          />
          <Button
            title="Buscar"
            onPress={searchByCity}
            disabled={loading}
          />
        </View>
      </View>

      <View style={styles.inputsRow}>
        <View style={styles.inputBox}>
          <Text style={styles.inputLabel}>Latitude</Text>
          <TextInput
            style={styles.input}
            value={latitude}
            onChangeText={setLatitude}
            placeholder="-23.2642"
            placeholderTextColor="#64748b"
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.inputLabel}>Longitude</Text>
          <TextInput
            style={styles.input}
            value={longitude}
            onChangeText={setLongitude}
            placeholder="-47.2992"
            placeholderTextColor="#64748b"
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </View>

      {loading && (
        <ActivityIndicator size="large" color="#ffffff" style={styles.loading} />
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {weather && !loading && (
        <>
          <View style={styles.iconContainer}>
            {getWeatherInfo(weather.weather_code).icon}
          </View>

          <Text style={styles.temperature}>
            {Math.round(weather.temperature_2m)}ºC
          </Text>

          <View style={styles.infoCard}>
            <Text style={styles.weather}>
              Clima: {getWeatherInfo(weather.weather_code).description}
            </Text>
            <Text style={styles.relativeHumidity}>
              Humidade: {weather.relative_humidity_2m}%
            </Text>
            <Text style={styles.apparentTemperature}>
              Sensação Térmica: {Math.round(weather.apparent_temperature)}ºC
            </Text>
            <Text style={styles.windSpeed}>
              Velocidade do Vento: {weather.wind_speed_10m} Km/h
            </Text>
          </View>

          <Text style={styles.description}>Consulte o clima da cidade!</Text>
        </>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title="Atualizar clima"
          onPress={searchWeather}
          disabled={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#142846',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  city: {
    color: '#cbd5e1',
    fontSize: 22,
    marginBottom: 14,
    textAlign: 'center',
  },
  citySearchBox: {
    width: '100%',
    marginBottom: 12,
  },
  citySearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cityInput: {
    flex: 1,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  inputBox: {
    flex: 1,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    color: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconContainer: {
    marginVertical: 4,
  },
  temperature: {
    color: '#ffc936',
    fontSize: 60,
    fontWeight: 'bold',
    marginTop: 2,
    marginBottom: 14,
  },
  infoCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  description: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 16,
  },
  relativeHumidity: {
    color: '#ffffff',
    fontSize: 15,
  },
  apparentTemperature: {
    color: '#ffffff',
    fontSize: 15,
  },
  weather: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  windSpeed: {
    color: '#ffffff',
    fontSize: 15,
  },
  buttonContainer: {
    width: '70%',
  },
  error: {
    color: '#ff6b6b',
    fontSize: 15,
    marginVertical: 10,
    textAlign: 'center',
  },
  loading: {
    marginVertical: 16,
  },
});