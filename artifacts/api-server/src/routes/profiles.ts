import { Router, type IRouter } from "express";
import { ListProfilesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const PROFILES = [
  {
    id: "senor",
    name: "Señor Enigma",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=senor&backgroundColor=E50914",
    isKids: false,
  },
  {
    id: "senora",
    name: "Señora Enigma",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=senora&backgroundColor=E50914",
    isKids: false,
  },
  {
    id: "kids",
    name: "Kids",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=kids&backgroundColor=FFD700",
    isKids: true,
  },
];

router.get("/profiles", async (_req, res): Promise<void> => {
  res.json(ListProfilesResponse.parse(PROFILES));
});

export default router;
