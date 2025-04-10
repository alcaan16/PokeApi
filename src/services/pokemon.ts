import { type PokemonListResponse, type Species, type EvolutionChainResponse  } from "../types/api";
import { type PokemonDetail } from "../types/api";


export const getPokemonById = async ({ id }: { id:string }) => {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);

    const results = (await response.json()) as PokemonDetail;

    return results;

}

export const allPokemonDetails = async () => {
  const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=9");
  const { results } = (await response.json()) as PokemonListResponse;

  const pokemons: PokemonDetail[] = await Promise.all(
    results.map(async (p) => {
      const res = await fetch(p.url);
      return (await res.json()) as PokemonDetail;
    })
  );
  return pokemons;
};

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

