const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const categorySelect = document.getElementById('category-select');
const areaSelect = document.getElementById('area-select');
const recipeGrid = document.getElementById('recipe-grid');
const loader = document.getElementById('loader');
const recentContainer = document.getElementById('recent-container');
const recipeModal = document.getElementById('recipe-modal');
const modalContent = document.getElementById('modal-content');
const closeModal = document.getElementById('close-modal');

// Base API URL
const API_BASE = 'https://www.themealdb.com/api/json/v1/1/';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    fetchAreas();
    renderRecentSearches();
    // Load default initial query to show some items
    searchRecipes('chicken');
});

// Event Listeners
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        searchRecipes(query);
        saveRecentSearch(query);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

categorySelect.addEventListener('change', () => {
    const category = categorySelect.value;
    if (category) filterByCategory(category);
});

areaSelect.addEventListener('change', () => {
    const area = areaSelect.value;
    if (area) filterByArea(area);
});

closeModal.addEventListener('click', () => {
    recipeModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === recipeModal) {
        recipeModal.style.display = 'none';
    }
});

// Fetch Dropdown Data
async function fetchCategories() {
    try {
        const res = await fetch(`${API_BASE}categories.php`);
        const data = await res.json();
        data.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.strCategory;
            option.textContent = cat.strCategory;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

async function fetchAreas() {
    try {
        const res = await fetch(`${API_BASE}list.php?a=list`);
        const data = await res.json();
        data.meals.forEach(item => {
            const option = document.createElement('option');
            option.value = item.strArea;
            option.textContent = item.strArea;
            areaSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching areas:', error);
    }
}

// API Fetch Handlers
async function searchRecipes(query) {
    showLoader(true);
    try {
        const res = await fetch(`${API_BASE}search.php?s=${query}`);
        const data = await res.json();
        displayRecipes(data.meals);
    } catch (error) {
        console.error('Error searching recipes:', error);
        displayRecipes(null);
    } finally {
        showLoader(false);
    }
}

async function filterByCategory(category) {
    showLoader(true);
    try {
        const res = await fetch(`${API_BASE}filter.php?c=${category}`);
        const data = await res.json();
        displayRecipes(data.meals);
    } catch (error) {
        displayRecipes(null);
    } finally {
        showLoader(false);
    }
}

async function filterByArea(area) {
    showLoader(true);
    try {
        const res = await fetch(`${API_BASE}filter.php?a=${area}`);
        const data = await res.json();
        displayRecipes(data.meals);
    } catch (error) {
        displayRecipes(null);
    } finally {
        showLoader(false);
    }
}

async function fetchRecipeDetails(id) {
    try {
        const res = await fetch(`${API_BASE}lookup.php?i=${id}`);
        const data = await res.json();
        showRecipeModal(data.meals[0]);
    } catch (error) {
        console.error('Error fetching details:', error);
    }
}

// Render Functions
function displayRecipes(meals) {
    recipeGrid.innerHTML = '';
    
    if (!meals) {
        recipeGrid.innerHTML = `<div class="no-results">No recipes found. Try another search term or filter!</div>`;
        return;
    }

    meals.forEach(meal => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <div class="recipe-info">
                <h3>${meal.strMeal}</h3>
                <div class="recipe-badges">
                    ${meal.strCategory ? `<span class="badge">${meal.strCategory}</span>` : ''}
                    ${meal.strArea ? `<span class="badge area">${meal.strArea}</span>` : ''}
                </div>
                <button class="view-btn" onclick="fetchRecipeDetails('${meal.idMeal}')">View Recipe</button>
            </div>
        `;
        recipeGrid.appendChild(card);
    });
}

function showRecipeModal(meal) {
    // Extract ingredients and measurements
    let ingredientsHTML = '';
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (ingredient && ingredient.trim() !== '') {
            ingredientsHTML += `<li>${measure ? measure : ''} ${ingredient}</li>`;
        }
    }

    modalContent.innerHTML = `
        <button class="close-btn" onclick="document.getElementById('recipe-modal').style.display='none'">&times;</button>
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <h2>${meal.strMeal}</h2>
        <div class="recipe-badges" style="margin-bottom: 15px;">
            <span class="badge">${meal.strCategory}</span>
            <span class="badge area">${meal.strArea}</span>
        </div>
        <h3>Ingredients:</h3>
        <ul class="ingredients-list">${ingredientsHTML}</ul>
        <h3>Instructions:</h3>
        <p class="instructions">${meal.strInstructions}</p>
    `;
    recipeModal.style.display = 'flex';
}

function showLoader(show) {
    loader.style.display = show ? 'block' : 'none';
}

// Local Storage Handling for Recent Searches
function saveRecentSearch(query) {
    let searches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    // Remove if already exists to prevent duplicates, add to front
    searches = searches.filter(item => item.toLowerCase() !== query.toLowerCase());
    searches.unshift(query);
    // Limit to last 5 searches
    if (searches.length > 5) searches.pop();
    localStorage.setItem('recentSearches', JSON.stringify(searches));
    renderRecentSearches();
}

function renderRecentSearches() {
    const searches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    recentContainer.innerHTML = '';
    
    if (searches.length === 0) return;

    const label = document.createElement('span');
    label.style.fontSize = '0.85rem';
    label.style.color = '#666';
    label.textContent = 'Recent:';
    recentContainer.appendChild(label);

    searches.forEach(term => {
        const tag = document.createElement('span');
        tag.className = 'recent-tag';
        tag.textContent = term;
        tag.addEventListener('click', () => {
            searchInput.value = term;
            searchRecipes(term);
        });
        recentContainer.appendChild(tag);
    });
}