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

export function App() {
    const [selectedBookA, setSelectedBookA] = useState(null);
    const [selectedBookB, setSelectedBookB] = useState(null);
    const [statsA, setStatsA] = useState(null);
    const [statsB, setStatsB] = useState(null);

    const [lengthOption, setLengthOption] = useState("sentences");
    const [occurrenceOption, setOccurrenceOption] = useState("words_per_sentence");

    const onSelectBookA = (option) => {
        if (!option) {
            setSelectedBookA(null);
            setSelectedBookB(null);
            setStatsA(null);
            setStatsB(null);
            return;
        }
        setSelectedBookA(option);
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
                setStatsA(data);
                logParsing(data);
            });
    };

    const onSelectBookB = (option) => {
        if (!option) {
            setSelectedBookB(null);
            setStatsB(null);
            return;
        }
        setSelectedBookB(option);
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
                setStatsB(data);
                logParsing(data);
            });
    };

    const wordsLengthSets = [];
    const sentencesLengthSets = [];

    const syllablesPerWordSets = [];

    const wordsPerParagraphSets = [];
    const wordsPerSentenceSets = [];
    const clausesPerSentenceSets = [];
    const sentencesPerParagraphSets = [];

    if (statsA) {
        wordsLengthSets.push({
            label: statsA.title,
            buckets: statsA.stats.structure.word_length_buckets,
            percentiles: statsA.stats.structure.word_length_percentiles,
            backgroundColor: cssvar("--color-a"),
        });
        sentencesLengthSets.push({
            label: statsA.title,
            buckets: statsA.stats.structure.sentence_length_buckets,
            percentiles: statsA.stats.structure.sentence_length_percentiles,
            backgroundColor: cssvar("--color-a"),
        });
        syllablesPerWordSets.push({
            label: statsA.title,
            buckets: statsA.stats.structure.syllables_buckets,
            percentiles: statsA.stats.structure.syllables_percentiles,
            backgroundColor: cssvar("--color-a"),
        });
        wordsPerParagraphSets.push({
            label: statsA.title,
            buckets: statsA.stats.structure.words_per_paragraph_buckets,
            percentiles: statsA.stats.structure.words_per_paragraph_percentiles,
            backgroundColor: cssvar("--color-a"),
        });
        wordsPerSentenceSets.push({
            label: statsA.title,
            buckets: statsA.stats.structure.words_per_sentence_buckets,
            percentiles: statsA.stats.structure.words_per_sentence_percentiles,
            backgroundColor: cssvar("--color-a"),
        });
        clausesPerSentenceSets.push({
            label: statsA.title,
            buckets: statsA.stats.structure.clauses_per_sentence_buckets,
            percentiles: statsA.stats.structure.clauses_per_sentence_percentiles,
            backgroundColor: cssvar("--color-a"),
        });
        sentencesPerParagraphSets.push({
            label: statsA.title,
            buckets: statsA.stats.structure.sentences_per_paragraph_buckets,
            percentiles: statsA.stats.structure.sentences_per_paragraph_percentiles,
            backgroundColor: cssvar("--color-a"),
        });
    }
    if (statsB) {
        wordsLengthSets.push({
            label: statsB.title,
            buckets: statsB.stats.structure.word_length_buckets,
            percentiles: statsB.stats.structure.word_length_percentiles,
            backgroundColor: cssvar("--color-b"),
        });
        sentencesLengthSets.push({
            label: statsB.title,
            buckets: statsB.stats.structure.sentence_length_buckets,
            percentiles: statsB.stats.structure.sentence_length_percentiles,
            backgroundColor: cssvar("--color-b"),
        });
        syllablesPerWordSets.push({
            label: statsB.title,
            buckets: statsB.stats.structure.syllables_buckets,
            percentiles: statsB.stats.structure.syllables_percentiles,
            backgroundColor: cssvar("--color-b"),
        });
        wordsPerParagraphSets.push({
            label: statsB.title,
            buckets: statsB.stats.structure.words_per_paragraph_buckets,
            percentiles: statsB.stats.structure.words_per_paragraph_percentiles,
            backgroundColor: cssvar("--color-b"),
        });
        wordsPerSentenceSets.push({
            label: statsB.title,
            buckets: statsB.stats.structure.words_per_sentence_buckets,
            percentiles: statsB.stats.structure.words_per_sentence_percentiles,
            backgroundColor: cssvar("--color-b"),
        });
        clausesPerSentenceSets.push({
            label: statsB.title,
            buckets: statsB.stats.structure.clauses_per_sentence_buckets,
            percentiles: statsB.stats.structure.clauses_per_sentence_percentiles,
            backgroundColor: cssvar("--color-b"),
        });
        sentencesPerParagraphSets.push({
            label: statsB.title,
            buckets: statsB.stats.structure.sentences_per_paragraph_buckets,
            percentiles: statsB.stats.structure.sentences_per_paragraph_percentiles,
            backgroundColor: cssvar("--color-b"),
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
            <header>
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
            </header>
            {statsA && <nav>
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
            </nav>}
            {statsA && <section id="structure">
                <div className="Content">
                    <h3>Count</h3>
                    <table>
                        {statsB && <thead>
                            <tr>
                                <th></th>
                                <th>{statsA.title}</th>
                                <th>{statsB.title}</th>
                            </tr>
                        </thead>}
                        <tbody>
                            <tr>
                                <th>Paragraphs</th>
                                <td>{statsA.stats.structure.paragraphs_count}</td>
                                {statsB && <td>{statsB.stats.structure.paragraphs_count}</td>}
                            </tr>
                            <tr>
                                <th>Sentences</th>
                                <td>{statsA.stats.structure.sentences_count}</td>
                                {statsB && <td>{statsB.stats.structure.sentences_count}</td>}
                            </tr>
                            <tr>
                                <th>Words</th>
                                <td>{statsA.stats.structure.words_count}</td>
                                {statsB && <td>{statsB.stats.structure.words_count}</td>}
                            </tr>
                            <tr>
                                <th>Characters</th>
                                <td>{statsA.stats.structure.characters_count}</td>
                                {statsB && <td>{statsB.stats.structure.characters_count}</td>}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>}
            {statsA && <section>
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
            </section>}
            {statsA && <section>
                <div className="Content">
                    <h3>Syllables</h3>
                    <BarWithPercentiles dark={true} sets={syllablesPerWordSets} />
                </div>
            </section>}
            {statsA && <section>
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
            </section>}
            {statsA && <section id="vocabulary">
                <div className="Content">
                </div>
            </section>}
            {statsA && <section id="grammar">
                <div className="Content">
                </div>
            </section>}
            {statsA && <section id="tone">
                <div className="Content">
                </div>
            </section>}
            {statsA && <section id="readability">
                <div className="Content">
                </div>
            </section>}
        </>
    );
}


function BarDemo() {
    // Mozilla Developer Network

    /**
     * Returns a random number between min (inclusive) and max (exclusive)
     */
    function getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Returns a random integer between min (inclusive) and max (inclusive).
     * The value is no lower than min (or the next integer greater than min
     * if min isn't an integer) and no greater than max (or the next integer
     * lower than max if max isn't an integer).
     * Using Math.round() will give you a non-uniform distribution!
     */
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Chart.js Bar Chart',
            },
            annotation: {
                annotations: {
                    p50: {
                        type: 'line',
                        borderColor: 'black',
                        borderWidth: 5,
                        scaleID: 'x',
                        value: 0,
                        label: {
                            enabled: true,
                            backgroundColor: 'black',
                            borderColor: 'black',
                            borderRadius: 10,
                            borderWidth: 2,
                            content: 'p25',
                            rotation: '0'
                        }
                    }
                }
            }
        }
    };

    const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
    const data = {
        labels,
        datasets: [
            {
                label: 'Dataset 1',
                data: labels.map(() => getRandomInt(0, 1000)),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
                label: 'Dataset 2',
                data: labels.map(() => getRandomInt(0, 1000)),
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
        ],
    };
    return <Bar options={options} data={data} />;
}

