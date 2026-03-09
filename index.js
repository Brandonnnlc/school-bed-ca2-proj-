const readline = require('readline-sync');
const { loadPokemon, searchPokemon, addPokemon } = require('./src/pokemonManager');

/**
 * Displays the main menu and handles user input.
 */
function mainMenu() {
    console.clear();
    console.log('====================================');
    console.log('      PKMN Master CLI Manager       ');
    console.log('====================================');
    console.log('1. List all Pokemon');
    console.log('2. Search Pokemon (Name/Type)');
    console.log('3. Add New Pokemon');
    console.log('0. Exit');
    console.log('------------------------------------');

    const choice = readline.question('Choose an option: ');

    switch (choice) {
        case '1':
            displayList(loadPokemon());
            break;
        case '2':
            const query = readline.question('Enter name or type to search: ');
            displayList(searchPokemon(query));
            break;
        case '3':
            addNewPokemon();
            break;
        case '0':
            console.log('Goodbye!');
            process.exit(0);
        default:
            console.log('Invalid choice. Press enter to continue...');
            readline.question('');
            mainMenu();
    }
}

/**
 * Displays a list of Pokemon in a formatted table.
 * @param {Array<Object>} list 
 */
function displayList(list) {
    if (list.length === 0) {
        console.log('\nNo Pokemon found.');
    } else {
        console.log('\nResults:');
        console.table(list);
    }
    readline.question('\nPress enter to return to menu...');
    mainMenu();
}

/**
 * Prompt user for new Pokemon details.
 */
function addNewPokemon() {
    console.log('\n--- Add New Pokemon ---');
    const name = readline.question('Name: ');
    const type1 = readline.question('Type 1: ');
    const type2 = readline.question('Type 2 (optional): ');

    if (!name || !type1) {
        console.log('Name and Type 1 are required!');
    } else {
        addPokemon({ Name: name, 'Type 1': type1, 'Type 2': type2 });
        console.log(`${name} added successfully!`);
    }
    readline.question('\nPress enter to return to menu...');
    mainMenu();
}

// Start the app
mainMenu();
