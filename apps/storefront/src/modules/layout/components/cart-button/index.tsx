import { retrieveCart } from "@lib/data/cart"
import CartDropdown from "../cart-dropdown"
import CartDrawer from "../cart-drawer"

export default async function CartButton() {
  const cart = await retrieveCart().catch(() => null)

  return (
    <>
      <CartDropdown cart={cart} />
      <CartDrawer cart={cart} />
    </>
  )
}
