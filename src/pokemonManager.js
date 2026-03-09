const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '..', 'data', 'pokemon.csv');

/**
 * Loads Pokemon from the CSV file.
 * @returns {Array<Object>} List of Pokemon objects.
 */
function loadPokemon() {
    try {
        if (!fs.existsSync(CSV_PATH)) {
            return [];
        }
        const data = fs.readFileSync(CSV_PATH, 'utf8');
        const lines = data.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',');
        return lines.slice(1).map(line => {
            const values = line.split(',');
            const pokemon = {};
            headers.forEach((header, index) => {
                pokemon[header.trim()] = values[index] ? values[index].trim() : '';
            });
            return pokemon;
        });
    } catch (error) {
        console.error('Error loading Pokemon:', error.message);
        return [];
    }
}

/**
 * Saves Pokemon list back to the CSV file.
 * @param {Array<Object>} pokemonList 
 */
function savePokemon(pokemonList) {
    try {
        if (pokemonList.length === 0) return;
        const headers = ['#', 'Name', 'Type 1', 'Type 2'];
        const csvHeaders = headers.join(',');
        const rows = pokemonList.map(p => {
            return headers.map(header => p[header] || '').join(',');
        });
        const content = [csvHeaders, ...rows].join('\n');
        fs.writeFileSync(CSV_PATH, content, 'utf8');
    } catch (error) {
        console.error('Error saving Pokemon:', error.message);
    }
}

/**
 * Searches for Pokemon by name or type.
 * @param {string} query 
 * @returns {Array<Object>}
 */
function searchPokemon(query) {
    const list = loadPokemon();
    const lowerQuery = query.toLowerCase();
    return list.filter(p =>
        p.Name.toLowerCase().includes(lowerQuery) ||
        p['Type 1'].toLowerCase().includes(lowerQuery) ||
        (p['Type 2'] && p['Type 2'].toLowerCase().includes(lowerQuery))
    );
}

/**
 * Fetches additional data from PokeAPI.
 * @param {string} name 
 * @returns {Promise<Object|null>}
 */
async function getPokeApiData(name) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);
        if (!response.ok) return null;
        const data = await response.json();
        return {
            sprite: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
            stats: data.stats.reduce((acc, s) => {
                acc[s.stat.name] = s.base_stat;
                return acc;
            }, {}),
            height: data.height,
            weight: data.weight
        };
    } catch (error) {
        console.error(`PokeAPI error for ${name}:`, error.message);
        return null;
    }
}

/**
 * Adds a new Pokemon to the collection.
 * @param {Object} newPokemon 
 */
function addPokemon(newPokemon) {
    const list = loadPokemon();
    const maxId = list.reduce((max, p) => Math.max(max, parseInt(p['#']) || 0), 0);
    newPokemon['#'] = (maxId + 1).toString();
    list.push(newPokemon);
    savePokemon(list);
}

module.exports = {
    loadPokemon,
    savePokemon,
    searchPokemon,
    addPokemon,
    getPokeApiData
};
