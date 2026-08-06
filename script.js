const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const categorySelect = document.getElementById('category-select');
const areaSelect = document.getElementById('area-select');
const resetBtn = document.getElementById('reset-btn');
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
    fetchCategoriesWithCount(); // Category count wala function
    fetchAreasWithCount();     // Area count wala function
    renderRecentSearches();
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

// Reset Button Event Listener
resetBtn.addEventListener('click', () => {
    searchInput.value = "";
    categorySelect.value = "";
    areaSelect.value = "";
    searchRecipes('chicken');
});

closeModal.addEventListener('click', () => {
    recipeModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === recipeModal) {
        recipeModal.style.display = 'none';
    }
});

// --- Fetch Categories with Recipe Count ---
async function fetchCategoriesWithCount() {
    try {
        const res = await fetch(`${API_BASE}categories.php`);
        const data = await res.json();
        
        if (!data.categories) return;

        for (let cat of data.categories) {
            const catName = cat.strCategory;
            try {
                const catRes = await fetch(`${API_BASE}filter.php?c=${catName}`);
                const catData = await catRes.json();
                
                const count = catData.meals ? catData.meals.length : 0;
                
                if (count > 0) {
                    const option = document.createElement('option');
                    option.value = catName;
                    option.textContent = `${catName} (${count})`;
                    categorySelect.appendChild(option);
                }
            } catch (err) {
                console.error(`Error fetching count for category ${catName}`, err);
            }
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

// --- Fetch Areas with Recipe Count ---
async function fetchAreasWithCount() {
    try {
        const res = await fetch(`${API_BASE}list.php?a=list`);
        const data = await res.json();
        
        if (!data.meals) return;

        for (let item of data.meals) {
            const areaName = item.strArea;
            if (areaName && areaName.trim() !== "") {
                try {
                    const areaRes = await fetch(`${API_BASE}filter.php?a=${areaName}`);
                    const areaData = await areaRes.json();
                    
                    const count = areaData.meals ? areaData.meals.length : 0;
                    
                    if (count > 0) {
                        const option = document.createElement('option');
                        option.value = areaName;
                        option.textContent = `${areaName} (${count})`;
                        areaSelect.appendChild(option);
                    }
                } catch (err) {
                    console.error(`Error fetching count for area ${areaName}`, err);
                }
            }
        }
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
    if (!category) return;
    searchInput.value = "";
    areaSelect.value = "";
    showLoader(true);
    try {
        const res = await fetch(`${API_BASE}filter.php?c=${category}`);
        const data = await res.json();
        displayFilteredRecipes(data.meals, category, null);
    } catch (error) {
        displayRecipes(null);
    } finally {
        showLoader(false);
    }
}

async function filterByArea(area) {
    if (!area) return;
    searchInput.value = "";
    categorySelect.value = "";
    showLoader(true);
    try {
        const res = await fetch(`${API_BASE}filter.php?a=${area}`);
        const data = await res.json();
        displayFilteredRecipes(data.meals, null, area);
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
                <div class="row">
                    <h3>${meal.strMeal}</h3>
                    <div class="recipe-badges">
                        ${meal.strCategory ? `<span class="badge">${meal.strCategory}</span>` : ''}
                        ${meal.strArea ? `<span class="badge area">${meal.strArea}</span>` : ''}
                    </div>
                </div>
                <button class="view-btn" onclick="fetchRecipeDetails('${meal.idMeal}')">View Recipe</button>
            </div>
        `;
        recipeGrid.appendChild(card);
    });
}

function displayFilteredRecipes(meals, categoryBadge = null, areaBadge = null) {
    recipeGrid.innerHTML = '';
    
    if (!meals) {
        recipeGrid.innerHTML = `<div class="no-results">No recipes found. Try another search term or filter!</div>`;
        return;
    }

    meals.forEach(meal => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        
        const catTag = meal.strCategory || categoryBadge;
        const areaTag = meal.strArea || areaBadge;

        card.innerHTML = `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <div class="recipe-info">
                <h3>${meal.strMeal}</h3>
                <div class="recipe-badges">
                    ${catTag ? `<span class="badge">${catTag}</span>` : ''}
                    ${areaTag ? `<span class="badge area">${areaTag}</span>` : ''}
                </div>
                <button class="view-btn" onclick="fetchRecipeDetails('${meal.idMeal}')">View Recipe</button>
            </div>
        `;
        recipeGrid.appendChild(card);
    });
}

function showRecipeModal(meal) {
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
    searches = searches.filter(item => item.toLowerCase() !== query.toLowerCase());
    searches.unshift(query);
    if (searches.length > 5) searches.pop();
    localStorage.setItem('recentSearches', JSON.stringify(searches));
    renderRecentSearches();
}

// --- Updated Function: Render Recent Searches with Remove (X) Button ---
function renderRecentSearches() {
    let searches = JSON.parse(localStorage.getItem('recentSearches')) || [];
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
        tag.style.display = 'inline-flex';
        tag.style.alignItems = 'center';
        tag.style.gap = '6px';
        
        // Text part (Click karne par search ho jayega)
        const textSpan = document.createElement('span');
        textSpan.textContent = term;
        textSpan.style.cursor = 'pointer';
        textSpan.addEventListener('click', () => {
            searchInput.value = term;
            searchRecipes(term);
        });

        // Close/Remove button part (X icon)
        const removeBtn = document.createElement('span');
        removeBtn.textContent = '×';
        removeBtn.style.fontWeight = 'bold';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.color = '#888';
        removeBtn.title = 'Remove';
        
        removeBtn.addEventListener('mouseover', () => removeBtn.style.color = '#ff4d4d');
        removeBtn.addEventListener('mouseout', () => removeBtn.style.color = '#888');

        // Remove button click event
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Parent click trigger hone se rokay ga
            removeRecentSearch(term);
        });

        tag.appendChild(textSpan);
        tag.appendChild(removeBtn);
        recentContainer.appendChild(tag);
    });
}

// Helper function to remove a single recent search item
function removeRecentSearch(termToRemove) {
    let searches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    searches = searches.filter(item => item.toLowerCase() !== termToRemove.toLowerCase());
    localStorage.setItem('recentSearches', JSON.stringify(searches));
    renderRecentSearches();
}
