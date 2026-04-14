import styles from './TableSkeleton.module.css'

interface TableSkeletonProps {
  columns: number
  rows?: number
}

export default function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className={styles.row}>
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j}>
              <div className={styles.shimmer} style={{ width: j === 0 ? '60%' : '80%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
