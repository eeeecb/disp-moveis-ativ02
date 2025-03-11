import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { 
  useFonts,
  EncodeSansExpanded_400Regular,
  EncodeSansExpanded_500Medium 
} from '@expo-google-fonts/encode-sans-expanded';
import { Ramabhadra_400Regular } from '@expo-google-fonts/ramabhadra';

// O correto seria usar um .env, mas para o propósito do projeto isso vai servir
const TMDB_API_KEY = "4331c96a302d1d0b42a5077364bd114b";

export default function App() {
  const [searchQuery, setSearchQuery] = useState('Barbie');
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [fontsLoaded] = useFonts({
    EncodeSansExpanded_400Regular,
    EncodeSansExpanded_500Medium,
    Ramabhadra_400Regular
  });

  const searchMovie = async (query) => {
    if (!query) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const searchResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`
      );
      
      const searchData = await searchResponse.json();
      
      if (searchData.results && searchData.results.length > 0) {
        const movieId = searchData.results[0].id;
        
        const movieResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=pt-BR`
        );
        
        const movieData = await movieResponse.json();
        setMovie(movieData);
        
        const creditsResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${TMDB_API_KEY}&language=pt-BR`
        );
        
        const creditsData = await creditsResponse.json();
        setCast(creditsData.cast.slice(0, 6));
      } else {
        setError('Nenhum filme encontrado');
        setMovie(null);
        setCast([]);
      }
    } catch (err) {
      setError('Erro ao buscar dados do filme');
      console.error('Error fetching movie data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchMovie('Barbie');
  }, []);

  const handleSearch = () => {
    searchMovie(searchQuery);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff69b4" />
        <Text>Carregando fontes...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <TouchableOpacity>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes</Text>
      </View>
      
      {/* barra de pesquisa */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar filme..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff69b4" />
          <Text style={styles.loadingText}>Carregando dados do filme...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : movie ? (
        <ScrollView>
          <View style={styles.movieCard}>
            {movie.poster_path ? (
              <Image
                source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
                style={styles.movieImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.movieImage, styles.noImageContainer]}>
                <Text style={styles.noImageText}>Sem imagem disponível</Text>
              </View>
            )}
            
            <View style={styles.movieDetails}>
              <Text style={styles.movieTitle}>{movie.title}</Text>
              <Text style={styles.movieSynopsis}>{movie.overview || 'Sinopse não disponível.'}</Text>
              
              <View style={styles.movieStats}>
                <Text style={styles.movieStat}>Orçamento: {movie.budget ? formatCurrency(movie.budget) : 'Não informado'}</Text>
                <Text style={styles.movieStat}>Voto: {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</Text>
                <Text style={styles.movieStat}>Duração: {movie.runtime ? `${movie.runtime} min` : 'Não informado'}</Text>
                <Text style={styles.movieStat}>Lançamento: {formatDate(movie.release_date)}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.actorsSection}>
            <Text style={styles.sectionTitle}>Atores</Text>
            
            {cast.length > 0 ? (
              cast.map((person, index) => (
                <TouchableOpacity key={index} style={styles.actorCard}>
                  {person.profile_path ? (
                    <Image 
                      source={{ uri: `https://image.tmdb.org/t/p/w200${person.profile_path}` }} 
                      style={styles.actorImage} 
                    />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <Text style={styles.placeholderText}>{person.name.substring(0, 1)}</Text>
                    </View>
                  )}
                  <View style={styles.actorInfo}>
                    <Text style={styles.characterName}>{person.character || 'Papel não informado'}</Text>
                    <Text style={styles.actorName}>{person.name}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noDataText}>Nenhuma informação de elenco disponível</Text>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Nenhum filme encontrado</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Constants.statusBarHeight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 24,
    marginRight: 16,
    color: 'green',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E88E5',
    fontFamily: 'Ramabhadra_400Regular',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    fontFamily: 'EncodeSansExpanded_400Regular',
  },
  searchButton: {
    backgroundColor: '#1E88E5',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'EncodeSansExpanded_500Medium',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: 'EncodeSansExpanded_400Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    fontFamily: 'EncodeSansExpanded_400Regular',
  },
  movieCard: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  movieImage: {
    width: '100%',
    height: 220,
  },
  noImageContainer: {
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#666',
    fontStyle: 'italic',
    fontFamily: 'EncodeSansExpanded_400Regular',
  },
  movieDetails: {
    padding: 16,
  },
  movieTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Ramabhadra_400Regular',
  },
  movieSynopsis: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    fontFamily: 'EncodeSansExpanded_400Regular',
  },
  movieStats: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  movieStat: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'EncodeSansExpanded_400Regular',
  },
  actorsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: 'Ramabhadra_400Regular',
  },
  actorCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  actorImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
  },
  placeholderImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  actorInfo: {
    flex: 1,
  },
  characterName: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Ramabhadra_400Regular',
  },
  actorName: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'EncodeSansExpanded_400Regular',
  },
  chevron: {
    fontSize: 20,
    color: '#999',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'EncodeSansExpanded_400Regular',
  },
});