import React, { useState } from 'react';
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

function BarWithPercentiles({buckets, percentiles}) {
    const labels = [];
    for (let bucket of buckets) {
        labels.push(`${bucket.start}-${bucket.end}`);
    }
    const data = {
        labels,
        datasets: [
            {
                label: '',
                data: labels.map((value, i) => buckets[i].count),
                backgroundColor: 'rgba(0, 0, 0, 1)',
            },
        ],
    };

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
        console.log(`bucket [${bucket.start}-${bucket.end}]`);
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

    const line = (label, value) => { return {
        type: 'line',
        borderColor: 'red',
        borderWidth: 5,
        scaleID: 'x',
        value: value,
        label: {
            enabled: true,
            backgroundColor: 'red',
            borderColor: 'red',
            borderRadius: 10,
            borderWidth: 2,
            content: label,
            rotation: '0'
        },
    }}

    const p25Line = line('p25', p25X);
    const p50Line = line('p50', p50X);
    const p75Line = line('p75', p75X);
    const p90Line = line('p90', p90X);
    const p95Line = line('p95', p95X);
    const p99Line = line('p99', p99X);

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false, // This will do dataset labels
            },
            annotation: {
                annotations: {
                    p25Line,
                    p50Line,
                    p75Line,
                    p90Line,
                    p95Line,
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

export function App() {
    const [selectedBookA, setSelectedBookA] = useState(null);
    const [statsA, setStatsA] = useState(null);
    const [statsB, setStatsB] = useState(null);

    const onSelectBookA = (option) => {
        setSelectedBookA(option);
        const slug = option["value"];
        fetch(`stats/${slug}.json`, {
          headers : {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
           }
        })
          .then(response => {
            return response.json();
          })
          .then(data => {
            setStatsA(data)
          });
    };

    return (
        <>
            <section>
                <BookSelect value={selectedBookA} books={booksNonFiction} onChange={onSelectBookA} />
            </section>
            <section>
                {statsA && <BarDemo />}
            </section>
            <section>
                {statsA && <BarWithPercentiles buckets={statsA.stats.structure.word_length_buckets} percentiles={statsA.stats.structure.word_length_percentiles} />}
            </section>
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
