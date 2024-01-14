import React, { useState } from 'react';
import './Reset.css';
import './App.css';

import booksAll from './assets/all.min.json';
import booksNonFiction from './assets/nonfiction.min.json';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';

import Select from 'react-select';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    annotationPlugin,
);

// Utility function to fetch the variables from the CSS
// (See this issue for context: https://github.com/chartjs/Chart.js/issues/9983)
function cssvar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name);
}


function mostPopularGenres(books) {
    let counter = new Map();
    for (let book of books) {
        for (let genre of book.genres) {
            if (!counter.has(genre)) {
                counter.set(genre, 0);
            }
            counter.set(genre, counter.get(genre) + 1);
        }
    }

    const entries = [...counter.entries()]
    entries.sort((e1, e2) => e1[1] > e2[1]);

    const maxGenres = Math.min(entries.length, 15);
    const results = entries.slice(0, maxGenres).map(e => e[0]);
    results.sort();
    return results;
}

const mostPopularGenresAll = mostPopularGenres(booksAll);
const mostPopularGenresNonfiction = mostPopularGenres(booksNonFiction);

function BookSelect({ value, books, onChange }) {

    const booksOptions = [];
    for (let book of books) {
        booksOptions.push({
            value: book["slug"],
            item: book,
        });
    }

    const formatBookLabel = ({ value, item }) => (
        <div style={{ display: "flex" }}>
            <strong>{item["title"]}</strong>&nbsp;by&nbsp;<em>{item["author"]}</em>&nbsp;({item["year"]})
        </div>
    );

    return (
        <>
            {/* Project: https://github.com/JedWatson/react-select */}
            {/* Demo: https://react-select.com/home */}
            {/* Example using custom format: https://codesandbox.io/embed/reactselect-formatoptionlabel-bde1q */}
            <Select
                defaultValue={value}
                options={booksOptions}
                formatOptionLabel={formatBookLabel}
                onChange={onChange}
                placeholder="Choose a book"
                isClearable={true}
            />
        </>
    );
}

function BarWithPercentiles({ dark, sets }) {
    const rBuckets = sets[0].buckets;
    for (let i = 1; i < sets.length; i++) {
        const iBuckets = sets[i].buckets;
        if (rBuckets.length !== iBuckets.length) {
            throw "Unable to visualize sets with different buckets";
        }
        for (let j = 0; j < iBuckets.length; j++) {
            if (rBuckets[j].start !== iBuckets[j].start) {
                throw `Bucket ${j} differs between sets 0 and ${i}`;
            }
            if (rBuckets[j].end !== iBuckets[j].end) {
                if (j < iBuckets.length - 1) {
                    // The last bucket can differ for open intervals (ex: 5+)
                    throw `Bucket ${j} differs between sets 0 and ${i}`;
                }
            }
        }
    }
    const labels = [];
    const datasets = [];
    for (let bucket of rBuckets) {
        if (bucket.start == bucket.end) { // Ex: 1-1, 2-2, 3-3
            labels.push(bucket.start);
        } else {
            labels.push(`${bucket.start}-${bucket.end}`);
        }
    }
    for (let set of sets) {
        datasets.push({
            label: set.label,
            data: labels.map((value, i) => set.buckets[i].count),
            backgroundColor: set.backgroundColor,
        });
    }

    const data = {
        labels,
        datasets: datasets,
    };

    const buckets = sets[0].buckets;
    const percentiles = sets[0].percentiles; // TODO
    let p25X = undefined;
    let p50X = undefined;
    let p75X = undefined;
    let p90X = undefined;
    let p95X = undefined;
    let p99X = undefined;
    const p25 = percentiles.p25;
    const p50 = percentiles.p50;
    const p75 = percentiles.p75;
    const p90 = percentiles.p90;
    const p95 = percentiles.p95;
    const p99 = percentiles.p99;

    const f = (p, i, bucket) => i + (p - bucket.start) / (bucket.end - bucket.start) - 0.5;
    // -0.5 because the axis is centered in the middle of the column
    //
    // Example: i = 2, start = 1, end = 2, p50 = 1.25
    // x = i + (p50 - start) / (end - start) - 0.5
    // x = 2 + (1.25 - 1) / (2 - 1) - 0.5
    // x = 1.75

    for (var i = 0; i < buckets.length; i++) {
        const bucket = buckets[i];
        if (p25 >= bucket.start && p25 <= bucket.end) {
            p25X = f(p25, i, bucket);
        }
        if (p50 >= bucket.start && p50 <= bucket.end) {
            p50X = f(p50, i, bucket);
        }
        if (p75 >= bucket.start && p75 <= bucket.end) {
            p75X = f(p75, i, bucket);
        }
        if (p90 >= bucket.start && p90 <= bucket.end) {
            p90X = f(p90, i, bucket);
        }
        if (p95 >= bucket.start && p95 <= bucket.end) {
            p95X = f(p95, i, bucket);
        }
        if (p99 >= bucket.start && p99 <= bucket.end) {
            p99X = f(p99, i, bucket);
        }
    }

    const textColor = cssvar(dark ? "--color-text-dark" : "--color-text-light");
    const backgroundColor = cssvar(dark ? "--color-bg-dark" : "--color-bg-light");
    const line = (label, value) => {
        return {
            type: 'line',
            borderColor: textColor,
            borderWidth: 5,
            scaleID: 'x',
            value: value,
            label: {
                enabled: true,
                backgroundColor: textColor,
                borderColor: textColor,
                borderRadius: 10,
                borderWidth: 2,
                content: label,
                rotation: '0',
                color: backgroundColor,
            },
        }
    }

    const p25Line = line('p25', p25X);
    const p50Line = line('p50', p50X);
    const p75Line = line('p75', p75X);
    const p90Line = line('p90', p90X);
    const p95Line = line('p95', p95X);
    const p99Line = line('p99', p99X);

    const options = {
        responsive: true,
        scales: {
            x: {
                ticks: {
                    color: textColor,
                },
                grid: {
                    color: textColor,
                },
            },
            y: {
                ticks: {
                    color: textColor,
                },
                grid: {
                    color: textColor,
                },
            }
        },
        plugins: {
            legend: {
                display: sets.length > 1, // This will hide the dataset labels by default
                labels: {
                    color: textColor,
                },
                title: {
                    color: textColor,
                }
            },
            annotation: {
                annotations: {
                    // p25Line,
                    p50Line,
                    // p75Line,
                    p90Line,
                    // p95Line,
                    p99Line,
                }
            }
        }
    };

    return (
        <>
            <Bar options={options} data={data} />
        </>
    );
}

function logParsing(data) {
    const { total_files, skipped_files, parsed_characters, percent_characters } = data.stats.parsing;
    const parsed_files = total_files - skipped_files;
    const parsed_percent = Math.round(parsed_files * 100 / total_files);
    console.log(`Retrieved ${data.title} containing ${total_files} files (${parsed_percent}% parsed) containing ${parsed_characters} characters (${percent_characters}% parsed)`);
}

export function Library({ onSelect }) {
    const [kind, setKind] = useState("nonfiction");
    const [filteredGenres, setFilteredGenres] = useState([]);

    let books = [];
    let genres = [];
    if (kind === "nonfiction") {
        books = booksNonFiction;
        genres = mostPopularGenresNonfiction;
    } else {
        books = booksAll;
        genres = mostPopularGenresAll;
    }

    if (genres.length > 0) {
        books = books.filter(b => {
            for (let genre of genres) {
                if (b.genres.includes(genre)) {
                    return true;
                }
            }
            return false;
        });
    }

    const onFilteredGenresChanged = (event) => {
        const genre = event.target.value;
        if (filteredGenres.includes(genre)) {
            setFilteredGenres(filteredGenres.splice(filteredGenres.indexOf(genre) - 1, 1));
        } else {
            const newFilteredGenres = [...filteredGenres, genre];
            newFilteredGenres.sort();
            setFilteredGenres(newFilteredGenres);
        }
        return;
    };

    return (
        <div className="FullScreen">
        <form>
            <div className="Form">

                {/* Kinds */}
                <div>
                    <label>
                        <input
                            type="radio"
                            value="all"
                            checked={kind === "all"}
                            onChange={setKind}
                        /> All
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="nonfiction"
                            checked={kind === "nonfiction"}
                            onChange={setKind}
                        /> Nonfiction
                    </label>
                </div>

                {/* Books */}
                <div>
                    <BookSelect books={books} onChange={onSelect} />
                </div>

                {/* Genres */}
                <div>
                    {genres.map((value, index) => {
                        return (
                            <label key={index}>
                                <input
                                    type="checkbox"
                                    value={value}
                                    checked={filteredGenres.includes(value)}
                                    onChange={onFilteredGenresChanged}
                                /> {value}
                            </label>
                        );
                    })}
                </div>
            </div>
        </form>

        </div>

    );
}

export function App() {
    const [showLibrary, setShowLibrary] = useState(true);

    const [selectedBooks, setSelectedBooks] = useState([]);
    const [stats, setStats] = useState([]);

    const [lengthOption, setLengthOption] = useState("sentences");
    const [occurrenceOption, setOccurrenceOption] = useState("words_per_sentence");

    const onAddBook = () => {
        setShowLibrary(true);
    };

    const onSelectBook = (option) => {
        if (!option) {
            return;
        }
        setSelectedBooks([...selectedBooks, option]);
        const slug = option["value"];
        fetch(`stats/${slug}.json`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
            .then(response => {
                return response.json();
            })
            .then(data => {
                setStats([...stats, data]);
                logParsing(data);
                setShowLibrary(false);
            });
    };

    const onDeselectBook = (book) => {
        console.log("remove", book);
        let index = -1;
        for (let i = 0; i < selectedBooks.length; i++) {
            if (selectedBooks[i].item.id === book.id) {
                index = i;
                break;
            }
        }
        if (index >= 0) {
            const newSelectedBooks = [...selectedBooks]
            const newStats = [...stats]
            newSelectedBooks.splice(index, 1);
            newStats.splice(index, 1);
            setSelectedBooks(newSelectedBooks);
            setStats(newStats);
            if (newSelectedBooks.length === 0) {
                setShowLibrary(true);
            }
        }
    };

    const wordsLengthSets = [];
    const sentencesLengthSets = [];

    const syllablesPerWordSets = [];

    const wordsPerParagraphSets = [];
    const wordsPerSentenceSets = [];
    const clausesPerSentenceSets = [];
    const sentencesPerParagraphSets = [];

    for (let i = 0; i < stats.length; i++) {
        const statsBook = stats[i];
        wordsLengthSets.push({
            label: statsBook.title,
            buckets: statsBook.stats.structure.word_length_buckets,
            percentiles: statsBook.stats.structure.word_length_percentiles,
            backgroundColor: cssvar(`--color-${i+1}`),
        });
        sentencesLengthSets.push({
            label: statsBook.title,
            buckets: statsBook.stats.structure.sentence_length_buckets,
            percentiles: statsBook.stats.structure.sentence_length_percentiles,
            backgroundColor: cssvar(`--color-${i+1}`),
        });
        syllablesPerWordSets.push({
            label: statsBook.title,
            buckets: statsBook.stats.structure.syllables_buckets,
            percentiles: statsBook.stats.structure.syllables_percentiles,
            backgroundColor: cssvar(`--color-${i+1}`),
        });
        wordsPerParagraphSets.push({
            label: statsBook.title,
            buckets: statsBook.stats.structure.words_per_paragraph_buckets,
            percentiles: statsBook.stats.structure.words_per_paragraph_percentiles,
            backgroundColor: cssvar(`--color-${i+1}`),
        });
        wordsPerSentenceSets.push({
            label: statsBook.title,
            buckets: statsBook.stats.structure.words_per_sentence_buckets,
            percentiles: statsBook.stats.structure.words_per_sentence_percentiles,
            backgroundColor: cssvar(`--color-${i+1}`),
        });
        clausesPerSentenceSets.push({
            label: statsBook.title,
            buckets: statsBook.stats.structure.clauses_per_sentence_buckets,
            percentiles: statsBook.stats.structure.clauses_per_sentence_percentiles,
            backgroundColor: cssvar(`--color-${i+1}`),
        });
        sentencesPerParagraphSets.push({
            label: statsBook.title,
            buckets: statsBook.stats.structure.sentences_per_paragraph_buckets,
            percentiles: statsBook.stats.structure.sentences_per_paragraph_percentiles,
            backgroundColor: cssvar(`--color-${i+1}`),
        });
    }

    const onLengthOptionChanged = (event) => {
        setLengthOption(event.target.value);
    };
    const onOccurrenceOptionChanged = (event) => {
        setOccurrenceOption(event.target.value);
    };

    return (
        <>
            {showLibrary && <Library onSelect={onSelectBook} />}
            {!showLibrary && <div>
                {/* <header>
                    <div className="Content">
                        <BookSelect value={selectedBookA} books={booksNonFiction} onChange={onSelectBookA} />
                    </div>
                    {statsA && <div className="Content">
                        <h1><strong>{statsA.title}</strong> ({statsA.year}) by <em>{statsA.author}</em></h1>
                        <h2># {statsA.number} on <a href={statsA.url}>Goodreads</a> ({statsA.avgRating} on {statsA.numberOfRatings} ratings)</h2>
                        <ul className="Genres">
                            {statsA.genres.map((value, index) => {
                                return <li key={index}>{value}</li>
                            })}
                        </ul>
                    </div>}
                    {statsA && <div className="Content">
                        or compare with <BookSelect value={selectedBookB} books={booksNonFiction.filter(book => book.title !== statsA.title)} onChange={onSelectBookB} />
                    </div>}
                </header> */}
                <aside>
                    <ul>
                        {stats.map((book, index) => {
                            return (
                                <li key={index}>
                                    <div className="BookOverview">
                                        <div className="BookCover">
                                            <strong>{book.title}</strong> ({book.year}) by <em>{book.author}</em>
                                        </div>
                                        <small># {book.number} on <a href={book.url}>Goodreads</a> ({book.avgRating} on {book.numberOfRatings} ratings)</small>
                                        <button onClick={() => onDeselectBook(book)}>Remove</button><br/>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    <button onClick={onAddBook}>Add</button>
                </aside>
                <nav>
                        <ul>
                            <li><a href="#structure">Structure</a></li>
                            <li>|</li>
                            <li><a href="#vocabulary">Vocabulary</a></li>
                            <li>|</li>
                            <li><a href="#grammar">Grammar</a></li>
                            <li>|</li>
                            <li><a href="#tone">Tone</a></li>
                            <li>|</li>
                            <li><a href="#readability">Readability</a></li>
                        </ul>
                </nav>
                <section id="structure">
                    <div className="Content">
                        <h3>Count</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th></th>
                                    {stats.map((book, index) => {
                                        return <th key={index}>{book.title}</th>
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th>Paragraphs</th>
                                    {stats.map((book, index) => {
                                        return <td key={index}>{book.stats.structure.paragraphs_count}</td>
                                    })}
                                </tr>
                                <tr>
                                    <th>Sentences</th>
                                    {stats.map((book, index) => {
                                        return <td key={index}>{book.stats.structure.sentences_count}</td>
                                    })}
                                </tr>
                                <tr>
                                    <th>Words</th>
                                    {stats.map((book, index) => {
                                        return <td key={index}>{book.stats.structure.words_count}</td>
                                    })}
                                </tr>
                                <tr>
                                    <th>Characters</th>
                                    {stats.map((book, index) => {
                                        return <td key={index}>{book.stats.structure.characters_count}</td>
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
                <section>
                    <div className="Content">
                        <h3>Length</h3>
                        <form>
                            <div className="radio">
                                <label>
                                    <input
                                        type="radio"
                                        value="words"
                                        checked={lengthOption === "words"}
                                        onChange={onLengthOptionChanged}
                                    /> Word Length
                                </label>
                            </div>
                            <div className="radio">
                                <label>
                                    <input
                                        type="radio"
                                        value="sentences"
                                        checked={lengthOption === "sentences"}
                                        onChange={onLengthOptionChanged}
                                    /> Sentence Length
                                </label>
                            </div>
                        </form>
                        {lengthOption === "words" && <BarWithPercentiles dark={false} sets={wordsLengthSets} />}
                        {lengthOption === "sentences" && <BarWithPercentiles dark={false} sets={sentencesLengthSets} />}
                    </div>
                </section>
                <section>
                    <div className="Content">
                        <h3>Syllables</h3>
                        <BarWithPercentiles dark={true} sets={syllablesPerWordSets} />
                    </div>
                </section>
                <section>
                    <div className="Content">
                        <h3>Occurrences</h3>
                        <form>
                            <div className="radio">
                                <label>
                                    <input
                                        type="radio"
                                        value="words_per_sentence"
                                        checked={occurrenceOption === "words_per_sentence"}
                                        onChange={onOccurrenceOptionChanged}
                                    /> Words per sentence
                                </label>
                            </div>
                            <div className="radio">
                                <label>
                                    <input
                                        type="radio"
                                        value="words_per_paragraph"
                                        checked={occurrenceOption === "words_per_paragraph"}
                                        onChange={onOccurrenceOptionChanged}
                                    /> Words per paragraph
                                </label>
                            </div>
                            <div className="radio">
                                <label>
                                    <input
                                        type="radio"
                                        value="clauses_per_sentence"
                                        checked={occurrenceOption === "clauses_per_sentence"}
                                        onChange={onOccurrenceOptionChanged}
                                    /> Clauses per sentence
                                </label>
                            </div>
                            <div className="radio">
                                <label>
                                    <input
                                        type="radio"
                                        value="sentences_per_paragraph"
                                        checked={occurrenceOption === "sentences_per_paragraph"}
                                        onChange={onOccurrenceOptionChanged}
                                    /> Sentences per paragraph
                                </label>
                            </div>
                        </form>
                        {occurrenceOption === "words_per_sentence" && <BarWithPercentiles dark={false} sets={wordsPerSentenceSets} />}
                        {occurrenceOption === "words_per_paragraph" && <BarWithPercentiles dark={false} sets={wordsPerParagraphSets} />}
                        {occurrenceOption === "clauses_per_sentence" && <BarWithPercentiles dark={false} sets={clausesPerSentenceSets} />}
                        {occurrenceOption === "sentences_per_paragraph" && <BarWithPercentiles dark={false} sets={sentencesPerParagraphSets} />}
                    </div>
                </section>
                <section id="vocabulary">
                    <div className="Content">
                    </div>
                </section>
                <section id="grammar">
                    <div className="Content">
                    </div>
                </section>
                <section id="tone">
                    <div className="Content">
                    </div>
                </section>
                <section id="readability">
                    <div className="Content">
                    </div>
                </section>
            </div>}
        </>
    );
}


