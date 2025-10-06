import {
  type PokemonListResponse,
  type Species,
  type EvolutionChainResponse,
  type PokemonSpecies,
  type TypePokemon,
} from '../types/api';
import { type PokemonDetail } from '../types/api';

// Cache para almacenar las respuestas
const cache = new Map<string, any>();

// Función para procesar peticiones en lotes
const fetchInBatches = async <T>(
  urls: string[],
  batchSize: number = 5,
  processor: (url: string) => Promise<T>
): Promise<T[]> => {
  const results: T[] = [];
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
};

const fetchWithRetry = async (url: string, retries = 3, delay = 1000) => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'PokeAPI/1.0',
          Accept: 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      lastError = error;
      if (i < retries - 1) {
        // No esperar en el último intento
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

/* para usar en evoluciones
export const getSpecies = async ({ url }: { url: string }) => {
  const response = await fetch(`${ url }`);
  const results = (await response.json()) as Species;

  return results;
};  

export const getEvolution = async ({ url }: { url: string }) => {
  const response = await fetch(`${url}`);
  const results = (await response.json()) as EvolutionChainResponse;

  return results;
};  

*/

export const getPokemonById = async ({ id }: { id: string }) => {
  try {
    const cacheKey = `pokemon-${id}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey) as PokemonDetail;
    }

    const response = await fetchWithRetry(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const results = (await response.json()) as PokemonDetail;

    // Guardar en caché
    cache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error(`Error al obtener el Pokémon ${id}:`, error);
    throw error;
  }
};

export const allPokemonDetails = async () => {
  try {
    // Intentar obtener la lista del caché
    const cacheKey = 'pokemon-list-all';
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey) as PokemonDetail[];
    }

    const response = await fetchWithRetry('https://pokeapi.co/api/v2/pokemon?limit=150');
    const { results } = (await response.json()) as PokemonListResponse;

    // Procesar los Pokémon en lotes de 5 para no sobrecargar la API
    const fetchPokemon = async (url: string) => {
      // Verificar caché individual
      if (cache.has(url)) {
        return cache.get(url) as PokemonDetail;
      }

      try {
        const res = await fetchWithRetry(url);
        const pokemon = (await res.json()) as PokemonDetail;
        cache.set(url, pokemon); // Guardar en caché
        return pokemon;
      } catch (error) {
        console.error(`Error al obtener detalles del Pokémon de ${url}:`, error);
        throw error;
      }
    };

    const pokemons = await fetchInBatches(
      results.map((p) => p.url),
      5,
      fetchPokemon
    );

    // Guardar la lista completa en caché
    cache.set(cacheKey, pokemons);
    return pokemons;
  } catch (error) {
    console.error('Error al obtener la lista de Pokémon:', error);
    throw error;
  }
};

export const allPokemonSpeciesDetails = async () => {
  const response = await fetch('https://pokeapi.co/api/v2/pokemon-species');
  const { results } = (await response.json()) as PokemonListResponse;

  const pokemons: PokemonSpecies[] = await Promise.all(
    results.map(async (p) => {
      const res = await fetch(p.url);
      return (await res.json()) as PokemonSpecies;
    })
  );
  return pokemons;
};
