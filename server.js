const express = require('express');
const path = require('path');
const cors = require('cors');
const { loadPokemon, searchPokemon, addPokemon } = require('./src/pokemonManager');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API: Get all pokemon
app.get('/api/pokemon', (req, res) => {
    res.json(loadPokemon());
});

// API: Search pokemon
app.get('/api/pokemon/search', (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.json(loadPokemon());
    }
    res.json(searchPokemon(query));
});

// API: Add new pokemon
app.post('/api/pokemon', (req, res) => {
    const { Name, 'Type 1': type1, 'Type 2': type2 } = req.body;
    if (!Name || !type1) {
        return res.status(400).json({ error: 'Name and Type 1 are required.' });
    }
    addPokemon({ Name, 'Type 1': type1, 'Type 2': type2 || '' });
    res.status(201).json({ message: 'Pokemon added successfully' });
});

// API: Get detailed pokemon data (external)
app.get('/api/pokemon/details/:name', async (req, res) => {
    const { name } = req.params;
    const { getPokeApiData } = require('./src/pokemonManager');
    const details = await getPokeApiData(name);
    if (!details) {
        return res.status(404).json({ error: 'Pokemon details not found' });
    }
    res.json(details);
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
