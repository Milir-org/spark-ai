import { useEffect } from "react";
import { useLocation } from "wouter";

export default function NewCampaign() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/channels/ppc?new=1", { replace: true });
  }, [setLocation]);
  return null;
}
