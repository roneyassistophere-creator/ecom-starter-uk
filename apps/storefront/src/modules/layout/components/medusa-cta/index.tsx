import { Text } from "@modules/common/components/ui"
import brand from "brand.config"

const MedusaCTA = () => {
  return (
    <Text className="txt-compact-small-plus text-ui-fg-muted">
      &copy; {new Date().getFullYear()} {brand.storeName}. All rights reserved.
    </Text>
  )
}

export default MedusaCTA
