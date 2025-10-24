let books = [];
let isLoaded = false;

const inferredBaseUrl = (() => {
	if (typeof window === "undefined") {
		return "http://localhost:4000";
	}

	const isFileProtocol = window.location.protocol === "file:";
	const origin = window.location.origin && window.location.origin !== "null" ? window.location.origin : "";

	if (window.BOOK_API_BASE_URL) {
		return window.BOOK_API_BASE_URL;
	}

	if (isFileProtocol || !origin) {
		return "http://localhost:4000";
	}

	return origin;
})();

const API_BASE_URL = inferredBaseUrl.replace(/\/$/, "");
const BOOKS_ENDPOINT = `${API_BASE_URL}/api/books`;

const genreSelect = document.getElementById("genreSelect");
const popularitySelect = document.getElementById("popularitySelect");
const eraSelect = document.getElementById("eraSelect");
const resultsHeading = document.getElementById("resultsHeading");
const bookResults = document.getElementById("bookResults");
const filterForm = document.getElementById("filterForm");
const activeFiltersContainer = document.getElementById("activeFiltersContainer");
const paginationControls = document.getElementById("paginationControls");

const PAGE_SIZE = 9;
let currentPage = 1;
let filteredBooks = [];

const filterState = {
	genres: new Set(),
	popularity: "any",
	era: "any"
};

const popularityLabels = {
	blockbuster: "Blockbuster hit",
	critical: "Critically adored",
	hidden: "Hidden gem"
};

const eraLabels = {
	classic: "Classic",
	modern: "Modern",
	contemporary: "Contemporary"
};

const popularityRank = {
	blockbuster: 1,
	critical: 2,
	hidden: 3
};

document.addEventListener("DOMContentLoaded", () => {
	updateActiveFilters();
	bootstrap();
});

genreSelect.addEventListener("change", handleGenreSelection);
popularitySelect.addEventListener("change", handlePopularityChange);
eraSelect.addEventListener("change", handleEraChange);

filterForm.addEventListener("reset", () => {
	setTimeout(() => {
		filterState.genres.clear();
		filterState.popularity = "any";
		filterState.era = "any";
		const placeholderOption = genreSelect.querySelector("option[value=\"\"]") || genreSelect.options[0];
		if (placeholderOption) {
			genreSelect.value = placeholderOption.value;
		}
		popularitySelect.value = "any";
		eraSelect.value = "any";
		currentPage = 1;
		updateActiveFilters();
		applyFilters();
	}, 0);
});

async function bootstrap() {
	setLoadingState("Brewing fresh recommendations...");

	try {
		books = await fetchBooks();
		isLoaded = true;
		currentPage = 1;
		populateGenreOptions();
		updateActiveFilters();
		applyFilters();
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		showLoadError(message);
	}
}

async function fetchBooks() {
	const response = await fetch(BOOKS_ENDPOINT, {
		headers: {
			Accept: "application/json"
		}
	});

	if (!response.ok) {
		throw new Error(`Request failed with status ${response.status}`);
	}

	const payload = await response.json();
	const catalogue = Array.isArray(payload?.data) ? payload.data : [];

	return catalogue.map(book => ({
		...book,
		genres: Array.isArray(book.genres) ? book.genres : []
	}));
}

function setLoadingState(message) {
	isLoaded = false;
	filteredBooks = [];
	currentPage = 1;
	clearPagination();
	resultsHeading.textContent = message;
	bookResults.innerHTML = "";
	const loading = document.createElement("div");
	loading.className = "loading-state";
	loading.textContent = message;
	bookResults.appendChild(loading);
}

function showLoadError(message) {
	isLoaded = false;
	books = [];
	filteredBooks = [];
	currentPage = 1;
	clearPagination();
	resultsHeading.textContent = "Unable to load recommendations right now.";
	bookResults.innerHTML = "";
	const errorBlock = document.createElement("div");
	errorBlock.className = "error-state";
	errorBlock.textContent = `Something went wrong: ${message}`;
	bookResults.appendChild(errorBlock);
}

function formatLabel(value) {
	if (!value) {
		return "";
	}
	return value.charAt(0).toUpperCase() + value.slice(1);
}

function populateGenreOptions() {
	for (let i = genreSelect.options.length - 1; i >= 0; i -= 1) {
		const option = genreSelect.options[i];
		if (option.value) {
			genreSelect.remove(i);
		}
	}

	const genres = Array.from(new Set(books.flatMap(book => Array.isArray(book.genres) ? book.genres : []))).sort();
	if (!genres.length) {
		return;
	}

	const fragment = document.createDocumentFragment();

	genres.forEach(genre => {
		const option = document.createElement("option");
		option.value = genre;
		option.textContent = genre;
		fragment.appendChild(option);
	});

	genreSelect.appendChild(fragment);
}

function handleGenreSelection() {
	const value = genreSelect.value;
	if (!value) {
		return;
	}

	genreSelect.value = "";

	if (filterState.genres.has(value)) {
		return;
	}

	filterState.genres.add(value);
	currentPage = 1;
	updateActiveFilters();
	applyFilters();
}

function handlePopularityChange() {
	const value = popularitySelect.value;
	if (filterState.popularity === value) {
		return;
	}

	filterState.popularity = value;
	currentPage = 1;
	updateActiveFilters();
	applyFilters();
}

function handleEraChange() {
	const value = eraSelect.value;
	if (filterState.era === value) {
		return;
	}

	filterState.era = value;
	currentPage = 1;
	updateActiveFilters();
	applyFilters();
}

function removeFilter(type, value) {
	if (type === "genre") {
		if (!filterState.genres.delete(value)) {
			return;
		}
	} else if (type === "popularity") {
		if (filterState.popularity === "any") {
			return;
		}
		filterState.popularity = "any";
		popularitySelect.value = "any";
	} else if (type === "era") {
		if (filterState.era === "any") {
			return;
		}
		filterState.era = "any";
		eraSelect.value = "any";
	}

	currentPage = 1;
	updateActiveFilters();
	applyFilters();
}

function updateActiveFilters() {
	activeFiltersContainer.innerHTML = "";
	const fragment = document.createDocumentFragment();

	filterState.genres.forEach(genre => {
		fragment.appendChild(createFilterChip("genre", genre, genre));
	});

	if (filterState.popularity !== "any") {
		const popularityLabel = popularityLabels[filterState.popularity] || filterState.popularity;
		fragment.appendChild(createFilterChip("popularity", filterState.popularity, `Popularity · ${popularityLabel}`));
	}

	if (filterState.era !== "any") {
		const eraLabel = eraLabels[filterState.era] || filterState.era;
		fragment.appendChild(createFilterChip("era", filterState.era, `Era · ${eraLabel}`));
	}

	if (!fragment.childNodes.length) {
		const emptyState = document.createElement("span");
		emptyState.className = "filter-empty";
		emptyState.textContent = "No filters selected yet.";
		activeFiltersContainer.appendChild(emptyState);
		return;
	}

	activeFiltersContainer.appendChild(fragment);
}

function createFilterChip(type, value, label) {
	const chip = document.createElement("div");
	chip.className = "filter-chip";
	chip.dataset.type = type;
	chip.dataset.value = value;

	const text = document.createElement("span");
	text.textContent = label;

	const removeButton = document.createElement("button");
	removeButton.type = "button";
	removeButton.setAttribute("aria-label", `Remove ${label} filter`);
	removeButton.textContent = "x";
	removeButton.addEventListener("click", () => removeFilter(type, value));

	chip.appendChild(text);
	chip.appendChild(removeButton);

	return chip;
}

function applyFilters() {
	if (!isLoaded) {
		return;
	}

	const genreFilters = Array.from(filterState.genres);
	const filtered = books.filter(book => {
		const genreList = Array.isArray(book.genres) ? book.genres : [];
		const matchesGenre = !genreFilters.length || genreFilters.every(genre => genreList.includes(genre));
		const matchesPopularity = filterState.popularity === "any" || book.popularity === filterState.popularity;
		const matchesEra = filterState.era === "any" || book.era === filterState.era;
		return matchesGenre && matchesPopularity && matchesEra;
	}).sort((a, b) => {
		const rankA = popularityRank[a.popularity] ?? Number.MAX_SAFE_INTEGER;
		const rankB = popularityRank[b.popularity] ?? Number.MAX_SAFE_INTEGER;
		return rankA - rankB || a.title.localeCompare(b.title);
	});

	filteredBooks = filtered;

	if (!filteredBooks.length) {
		currentPage = 1;
		renderBooksPage();
		return;
	}

	const totalPages = Math.ceil(filteredBooks.length / PAGE_SIZE);
	if (currentPage > totalPages) {
		currentPage = totalPages;
	}
	if (currentPage < 1) {
		currentPage = 1;
	}

	renderBooksPage();
}

function renderBooksPage() {
	bookResults.innerHTML = "";

	if (!filteredBooks.length) {
		if (!books.length) {
			resultsHeading.textContent = "No books are available yet.";
		} else {
			resultsHeading.textContent = "No matches yet—try adjusting your filters.";
		}

		const emptyState = document.createElement("div");
		emptyState.className = "empty-state";
		emptyState.textContent = "Tip: broaden your genre or era to surface more titles.";
		bookResults.appendChild(emptyState);
		clearPagination();
		return;
	}

	const totalPages = Math.max(1, Math.ceil(filteredBooks.length / PAGE_SIZE));
	if (currentPage > totalPages) {
		currentPage = totalPages;
	}
	if (currentPage < 1) {
		currentPage = 1;
	}

	const startIndex = (currentPage - 1) * PAGE_SIZE;
	const pageItems = filteredBooks.slice(startIndex, startIndex + PAGE_SIZE);
	const totalCount = filteredBooks.length;
	const label = totalCount === 1 ? "recommendation" : "recommendations";
	const pageLabel = totalPages > 1 ? ` • Page ${currentPage} of ${totalPages}` : "";

	resultsHeading.textContent = `${totalCount} ${label}${pageLabel}`;

	renderBookCards(pageItems);
	renderPagination(totalPages);
}

function renderBookCards(collection) {
	const fragment = document.createDocumentFragment();
	collection.forEach(book => {
		fragment.appendChild(createBookCard(book));
	});

	bookResults.appendChild(fragment);
}

function renderPagination(totalPages) {
	if (!paginationControls) {
		return;
	}

	paginationControls.innerHTML = "";

	if (totalPages <= 1) {
		return;
	}

	const fragment = document.createDocumentFragment();

	for (let page = 1; page <= totalPages; page += 1) {
		const button = document.createElement("button");
		button.type = "button";
		button.textContent = String(page);
		button.setAttribute("aria-label", `Go to page ${page}`);

		if (page === currentPage) {
			button.classList.add("active");
			button.setAttribute("aria-current", "page");
			button.setAttribute("aria-label", `Current page, page ${page}`);
		}

		button.addEventListener("click", () => {
			if (page === currentPage) {
				return;
			}

			currentPage = page;
			renderBooksPage();
		});

		fragment.appendChild(button);
	}

	paginationControls.appendChild(fragment);
}

function clearPagination() {
	if (paginationControls) {
		paginationControls.innerHTML = "";
	}
}

function createBookCard(book) {
	const card = document.createElement("article");
	card.className = "book-card";

	const title = document.createElement("h2");
	title.textContent = book.title;

	const author = document.createElement("p");
	author.className = "meta";
	author.textContent = `by ${book.author}`;

	const summary = document.createElement("p");
	summary.textContent = book.summary;

	const tags = document.createElement("div");
	tags.className = "tags";

	(book.genres || []).forEach(genre => {
		const tag = document.createElement("span");
		tag.className = "tag";
		tag.textContent = genre;
		tags.appendChild(tag);
	});

	const metaLine = document.createElement("p");
	metaLine.className = "meta";
	const popularityLabel = popularityLabels[book.popularity] || formatLabel(book.popularity);
	const eraLabel = eraLabels[book.era] || formatLabel(book.era);
	metaLine.textContent = `${popularityLabel} · ${eraLabel}`;

	const link = document.createElement("a");
	link.href = book.goodreads;
	link.target = "_blank";
	link.rel = "noopener noreferrer";
	link.textContent = "View on Goodreads";

	card.appendChild(title);
	card.appendChild(author);
	card.appendChild(summary);
	card.appendChild(tags);
	card.appendChild(metaLine);
	card.appendChild(link);

	return card;
}
