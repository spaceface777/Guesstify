import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import ChartDataLabels from 'chartjs-plugin-datalabels'

import { getLocalStorageDataFromKey } from '../Utils'
import { stageToTime } from '../logic'
import { STATS_KEY } from '../constants'

import { SavedStats } from '../types/guesstify'

import styles from '../css/app.module.scss'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Legend,
  ChartDataLabels,
)

class Stats extends React.Component {
  state = {}

  constructor(props: Record<string, unknown>) {
    super(props)
  }

  render() {
    const savedStats = getLocalStorageDataFromKey(STATS_KEY, {}) as SavedStats
    const parsedStats = Object.entries(savedStats)
      .reduce((accum, [key, value]) => {
        const stage = parseInt(key, 10)
        // I pass in -1 when saving if they gave up
        if (stage === -1) {
          accum['gave up'] = value
        } else if (stage > 5) { // >16s
          const longOnes = accum['>16s'] || 0
          accum['>16s'] = longOnes + value
        } else { // stage is 0-5, output seconds
          const time = stageToTime(stage)
          accum[`${time}s`] = value
        }
        return accum
      }, {} as { [key: string]: number })

    const chartData = {
      labels: Object.keys(parsedStats),
      datasets: [
        {
          label: 'Dataset 1',
          data: Object.values(parsedStats),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
      ],
    }

    const chartOptions = {
      responsive: true,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false,
          position: 'top',
        },
        datalabels: {
          color: '#fff',
          anchor: 'end',
          align: 'start',
          offset: 8,
          clip: true,
          formatter: (value) => {
            if (value == 1) return `${value} song`
            return `${value} songs`
          },
        },
      },
      scale: {
        ticks: {
          precision: 0,
        },
      },
      animation: {
        duration: 1000,
      },
    } as const

    const totalGames = Object.values(savedStats).reduce((accum, value) => accum + value, 0)
    const winPercentage = 1 - (savedStats['-1'] || 0) / totalGames

    console.log({
      chartData,
      totalGames,
      winPercentage,
    })

    return (
      <>
        <div className={styles.container}>
          <h1 className={styles.title}>{'Guesstify'}</h1>
          <h2>Stats</h2>
          <p>Win percentage: {`${(winPercentage * 100).toFixed(2)}%`}</p>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Songs</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(parsedStats).map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{value}</td>
                  <td>{(value / (totalGames) * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* TODO: add total games played and games won vs gave up */}
          <Bar options={chartOptions} data={chartData} />
        </div>
      </>
    )
  }
}

export default Stats
