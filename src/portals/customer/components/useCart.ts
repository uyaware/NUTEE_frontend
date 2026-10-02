import { useQuery } from "@tanstack/react-query";
import { useSession } from "../../../shared/auth/useSession";
import { services } from "../../../services";

export function useCart() {
  const session = useSession("customer");
  return useQuery({
    queryKey: ["customer", session.data?.id ?? "guest", "cart"],
    queryFn: services.cart.get,
    enabled: !session.isPending,
  });
}
