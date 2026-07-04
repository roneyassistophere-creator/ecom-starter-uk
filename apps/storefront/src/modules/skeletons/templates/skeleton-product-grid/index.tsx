import repeat from "@lib/util/repeat"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

const SkeletonProductGrid = ({
  numberOfProducts = 8,
  gridClass = "grid-cols-2 small:grid-cols-3 medium:grid-cols-4",
}: {
  numberOfProducts?: number
  gridClass?: string
}) => {
  return (
    <ul
      className={`grid gap-x-6 gap-y-8 flex-1 ${gridClass}`}
      data-testid="products-list-loader"
    >
      {repeat(numberOfProducts).map((index) => (
        <li key={index}>
          <SkeletonProductPreview />
        </li>
      ))}
    </ul>
  )
}

export default SkeletonProductGrid
