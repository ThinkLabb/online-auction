import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { OrderCompletionView } from "../components/ordercompletionview"
import { ClipLoader } from "react-spinners"

type OrderStatus =
  | "pending_payment"
  | "payment_confirmed"
  | "shipped"
  | "completed"
  | "cancelled"

interface Order {
  order_id: string
  product_name: string
  partner_name: string 
  partner_id: string
  final_price: number
  status: OrderStatus
  shipping_address: string | null
  isReviewed: boolean
  product_id: string
  is_seller: boolean
  cur_user_id: string
  is_reviewed: boolean
  cur_name: string
}



export default function Payment() {
  const { orderid } = useParams<{ orderid: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  useEffect(() => {
    if (!orderid) return

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/payment/${orderid}`)

        const result = await res.json()

        if (!result.isSuccess) {
          setError(result.message)
          return
        }

        setOrder(result.data)

      } catch (err) {
        setError(String(err))
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderid])

  // ---------- UI STATES ----------
  if (loading) {
    return (
      <>
        <div className="w-full h-full min-h-[50vh] flex flex-col justify-center items-center">
          <ClipLoader size={50} color="#8D0000"/>
        </div>
      </>
     
    )
  }

  if (error || !order) {
    return (
      <>
        <div className="w-full h-full min-h-[50vh] flex flex-col justify-center items-center text-[#8D0000] text-3xl">
          {error}
        </div>
      </>
    )
  
  }

  return (
    <OrderCompletionView
      order={order}
    />
  )
}
