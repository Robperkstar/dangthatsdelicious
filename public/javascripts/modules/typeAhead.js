import axios from 'axios'; // similar to fetch (used to get stuff from urls) but with more funcitonality
import dompurify from 'dompurify';
function searchResultsHTML (stores) {
  return stores.map(store => {
    return `
    <a href ="/store/${store.slug}" class="search__result">
    <strong>${store.name}</strong>
    </a>
    `;
  }).join('');
}

function typeAhead (search) { // takes in the search box - this funtion is used in delicous-app.js
  if (!search) return; // if no search, don't run the funciton
  const searchInput = search.querySelector('input[name="search"]'); // this is where we put our input into the search
  const searchResults = search.querySelector('.search__results');
  searchInput.on('input', function () { // on is from bling - instead of add event listener- for input
    // if there is no input  then return
    if (!this.value) {
      searchResults.style.display = 'none';
      return; // stop!
    }
    searchResults.style.display = 'block'; // put a style on search results- displayes in block
    axios // use axios which is similar to fetch
      .get(`/api/search?q=${this.value}`) // this.value is the input value
      .then(res => {
        if (res.data.length) { // if the is some data coming back - i.e if the word we put into the search is a word in our database log something to show.
          searchResults.innerHTML = /* dompurify.sanitize(*/searchResultsHTML(res.data); // sanitize results
          return;
        }
        // if no results found tell them
        searchResults.innerHTML = `<div class="search__result"> No results for ${this.value} found</div>`;
      })
      .catch(err => {
        console.error(err);
      });
  });
  searchInput.on('keyup', (e) => { // this function is to go up and down on the list produced in search bar
    // if the up down or enter key isn't presses, don't run this function
    if (![13, 40, 38].includes(e.keyCode)) {
      return;//
    }
    const activeClass = 'search__result--active';
    const current = search.querySelector(`.${activeClass}`); // the current is the one with activeClass
    const items = search.querySelectorAll('.search__result'); // grab all the search results and put into items
    let next;
    if (e.keyCode === 40 && current) { // if press down and there is a curent store highlighted
      next = current.nextElementSibling || items[0]; // next will be the next down or the top of list
    } else if (e.keyCode === 40) { // if there is none highlight next will equal first in the list
      next = items[0];
    } else if (e.keyCode === 38 && current) {
      next = current.previousElementSibling || items[items.length - 1];
    } else if (e.keyCode === 38) {
      next = items[items.length - 1];
    } else if (e.keyCode === 13 && current.href) {
      window.location = '';
      window.location = current.href;
    }
    if (current) {
      current.classList.remove(activeClass);
    }
    next.classList.add(activeClass);
  });
}

export default typeAhead;
