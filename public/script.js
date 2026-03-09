document.addEventListener('DOMContentLoaded', () => {
    let pokemonList = [];
    const pokemonGrid = document.getElementById('pokemonGrid');
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const sortOrder = document.getElementById('sortOrder');
    const openFormBtn = document.getElementById('openFormBtn');
    const closeFormBtn = document.getElementById('closeFormBtn');
    const modalOverlay = document.getElementById('modalOverlay');
    const addPokemonForm = document.getElementById('addPokemonForm');
    const detailModal = document.getElementById('detailModal');
    const closeDetailBtn = document.getElementById('closeDetailBtn');
    const pokemonDetail = document.getElementById('pokemonDetail');

    // Initial fetch
    init();

    async function init() {
        await fetchPokemon();
        setupEventListeners();
        lucide.createIcons();
    }

    // Event Listeners
    function setupEventListeners() {
        [searchInput, typeFilter, sortOrder].forEach(el => {
            el.addEventListener('input', () => filterAndRender());
        });

        openFormBtn.addEventListener('click', () => {
            gsap.to(modalOverlay, { display: 'flex', opacity: 1, duration: 0.3 });
        });

        [closeFormBtn, modalOverlay].forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target === el || el === closeFormBtn) {
                    gsap.to(modalOverlay, {
                        opacity: 0, duration: 0.2, onComplete: () => {
                            modalOverlay.style.display = 'none';
                            addPokemonForm.reset();
                        }
                    });
                }
            });
        });

        closeDetailBtn.addEventListener('click', () => {
            gsap.to(detailModal, {
                opacity: 0, duration: 0.2, onComplete: () => {
                    detailModal.style.display = 'none';
                }
            });
        });

        addPokemonForm.addEventListener('submit', handleFormSubmit);
    }

    // Core functions
    async function fetchPokemon() {
        try {
            // 1. Load default data
            const response = await fetch('data/pokemon.json');
            const defaultList = await response.json();

            // 2. Load custom data from localStorage
            const customList = JSON.parse(localStorage.getItem('customPokemon') || '[]');

            // 3. Combine
            pokemonList = [...defaultList, ...customList];

            filterAndRender();
        } catch (error) {
            console.error('Fetch error:', error);
            pokemonGrid.innerHTML = '<p class="no-results">Failed to load Pokemon. Is the repository structured correctly?</p>';
        }
    }

    function filterAndRender() {
        const query = searchInput.value.toLowerCase();
        const type = typeFilter.value.toLowerCase();
        const sort = sortOrder.value;

        let filtered = pokemonList.filter(p => {
            const matchesQuery = p.Name.toLowerCase().includes(query) ||
                p['Type 1'].toLowerCase().includes(query) ||
                (p['Type 2'] && p['Type 2'].toLowerCase().includes(query));
            const matchesType = !type || p['Type 1'].toLowerCase() === type || (p['Type 2'] && p['Type 2'].toLowerCase() === type);
            return matchesQuery && matchesType;
        });

        // Sorting
        filtered.sort((a, b) => {
            if (sort === 'id-asc') return parseInt(a['#']) - parseInt(b['#']);
            if (sort === 'id-desc') return parseInt(b['#']) - parseInt(a['#']);
            if (sort === 'name-asc') return a.Name.localeCompare(b.Name);
            if (sort === 'name-desc') return b.Name.localeCompare(a.Name);
            return 0;
        });

        renderGrid(filtered);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const newPokemon = {
            Name: document.getElementById('name').value,
            'Type 1': document.getElementById('type1').value,
            'Type 2': document.getElementById('type2').value
        };

        // Static auto-increment
        const maxId = pokemonList.reduce((max, p) => Math.max(max, parseInt(p['#']) || 0), 0);
        newPokemon['#'] = (maxId + 1).toString();

        // Save to localStorage
        const customList = JSON.parse(localStorage.getItem('customPokemon') || '[]');
        customList.push(newPokemon);
        localStorage.setItem('customPokemon', JSON.stringify(customList));

        gsap.to(modalOverlay, {
            opacity: 0, duration: 0.2, onComplete: async () => {
                modalOverlay.style.display = 'none';
                addPokemonForm.reset();
                await fetchPokemon();
            }
        });
    }

    function renderGrid(list) {
        pokemonGrid.innerHTML = '';
        if (list.length === 0) {
            pokemonGrid.innerHTML = '<div class="no-results">No Pokemon found matching your criteria.</div>';
            return;
        }

        list.forEach((pokemon, index) => {
            const card = document.createElement('div');
            card.className = 'pokemon-card';
            card.style.opacity = '0';

            const id = pokemon['#'] || '??';
            const name = pokemon.Name;
            const t1 = pokemon['Type 1'];
            const t2 = pokemon['Type 2'];

            card.innerHTML = `
                <div class="id-tag">#${id.padStart(3, '0')}</div>
                <h3>${name}</h3>
                <div class="types">
                    <span class="type-pill" data-type="${t1.toLowerCase()}">${t1}</span>
                    ${t2 ? `<span class="type-pill" data-type="${t2.toLowerCase()}">${t2}</span>` : ''}
                </div>
            `;

            card.addEventListener('click', () => showDetails(pokemon));
            pokemonGrid.appendChild(card);

            // GSAP Entry Animation
            gsap.fromTo(card,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, delay: index * 0.05, ease: 'power2.out' }
            );
        });
    }

    async function showDetails(pokemon) {
        pokemonDetail.innerHTML = '<div class="loading">Loading details...</div>';
        detailModal.style.display = 'flex';
        gsap.to(detailModal, { opacity: 1, duration: 0.3 });

        try {
            // DIRECT POKEAPI CALL
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.Name.toLowerCase()}`);
            if (!response.ok) throw new Error('Not found');
            const data = await response.json();

            const details = {
                sprite: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
                stats: data.stats.reduce((acc, s) => {
                    acc[s.stat.name] = s.base_stat;
                    return acc;
                }, {}),
                height: data.height,
                weight: data.weight
            };

            renderDetails(pokemon, details);
        } catch (error) {
            pokemonDetail.innerHTML = `
                <div class="detail-header" style="flex-direction: column; padding: 5rem 2rem;">
                    <h2 style="font-size: 2.5rem; margin-bottom: 1rem;">${pokemon.Name}</h2>
                    <div class="types" style="margin-bottom: 2rem;">
                        <span class="type-pill" data-type="${pokemon['Type 1'].toLowerCase()}">${pokemon['Type 1']}</span>
                        ${pokemon['Type 2'] ? `<span class="type-pill" data-type="${pokemon['Type 2'].toLowerCase()}">${pokemon['Type 2']}</span>` : ''}
                    </div>
                    <p style="color: var(--text-muted);">PokeAPI could not find data for this Pokemon.</p>
                </div>
            `;
        }
    }

    function renderDetails(pokemon, details) {
        const statsHtml = Object.entries(details.stats).map(([name, value]) => `
            <div class="stat-bar-container">
                <div class="stat-label">
                    <span>${name.toUpperCase()}</span>
                    <span>${value}</span>
                </div>
                <div class="stat-bar">
                    <div class="stat-fill" style="width: 0%" data-value="${(value / 255) * 100}%"></div>
                </div>
            </div>
        `).join('');

        pokemonDetail.innerHTML = `
            <div class="pokemon-detail-layout">
                <div class="detail-header">
                    <img src="${details.sprite}" alt="${pokemon.Name}">
                    <div class="id-tag" style="position:static; font-size: 3rem; margin-top: 1rem;">#${pokemon['#'].padStart(3, '0')}</div>
                </div>
                <div class="detail-body">
                    <h2 style="font-size: 2.5rem; margin-bottom: 0.5rem;">${pokemon.Name}</h2>
                    <div class="types" style="margin-bottom: 2rem;">
                        <span class="type-pill" data-type="${pokemon['Type 1'].toLowerCase()}">${pokemon['Type 1']}</span>
                        ${pokemon['Type 2'] ? `<span class="type-pill" data-type="${pokemon['Type 2'].toLowerCase()}">${pokemon['Type 2']}</span>` : ''}
                    </div>
                    <div class="stats-grid">
                        ${statsHtml}
                    </div>
                    <div style="margin-top: 2rem; display: flex; gap: 2rem; color: var(--text-muted); font-weight: 600;">
                        <span>HT: ${details.height / 10}m</span>
                        <span>WT: ${details.weight / 10}kg</span>
                    </div>
                </div>
            </div>
        `;

        // Animate stat bars
        gsap.to('.stat-fill', {
            width: (i, el) => el.dataset.value,
            duration: 1,
            stagger: 0.1,
            ease: 'power2.out'
        });
    }
});
