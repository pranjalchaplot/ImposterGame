"use client";

import { useState, useEffect, type ReactNode } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Building2,
  Activity,
  Film,
  Gamepad2,
  Ghost,
  Users,
  ShieldAlert,
  Eye,
  PartyPopper,
  Pizza,
  Shirt,
  Guitar,
  ChevronDown, // Added ChevronDown icon
  X,
} from "lucide-react";

interface Category {
  value: string;
  label: string;
  icon: ReactNode;
}

const CATEGORIES: Category[] = [
  {
    value: "location",
    label: "Locations",
    icon: <MapPin className="mr-2 h-5 w-5 text-primary" />,
  },
  {
    value: "cities",
    label: "Cities",
    icon: <Building2 className="mr-2 h-5 w-5 text-primary" />,
  },
  {
    value: "activities",
    label: "Activities",
    icon: <Activity className="mr-2 h-5 w-5 text-primary" />,
  },
  {
    value: "movies",
    label: "Movies",
    icon: <Film className="mr-2 h-5 w-5 text-primary" />,
  },
  {
    value: "games",
    label: "Video Games",
    icon: <Gamepad2 className="mr-2 h-5 w-5 text-primary" />,
  },
  {
    value: "mythology",
    label: "Mythology",
    icon: <Ghost className="mr-2 h-5 w-5 text-primary" />,
  },
  {
    value: "festivals",
    label: "Festivals",
    icon: <PartyPopper className="mr-2 h-5 w-5 text-primary" />,
  },
  {
    value: "food",
    label: "Food",
    icon: <Pizza className="mr-2 h-5 w-5 text-primary" />,
  },
  {
    value: "clothings",
    label: "Clothings",
    icon: <Shirt className="mr-2 h-5 w-5 text-primary" />,
  },
  {
    value: "instruments",
    label: "Instruments",
    icon: <Guitar className="mr-2 h-5 w-5 text-primary" />,
  },
];

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 20;
const DEFAULT_PLAYERS = 5;
const MIN_IMPOSTERS_SLIDER = 1;

export interface GameConfiguration {
  category: string;
  players: number;
  imposters: number;
  revealEliminatedPlayerRole: boolean;
}

interface ConfigureGameFormProps {
  onConfigurationComplete: (settings: GameConfiguration) => void;
}

const AddPlayerModal = ({
  isOpen,
  onClose,
  onAddPlayer,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddPlayer: (playerName: string) => void;
}) => {
  const [playerName, setPlayerName] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-md">
        <Label htmlFor="player-name">Player Name:</Label>
        <input
          type="text"
          id="player-name"
          className="border border-gray-300 rounded-md p-2 w-full"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <div className="flex justify-end mt-4 space-x-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (playerName.trim() !== "") {
                onAddPlayer(playerName);
                onClose();
              }
              onAddPlayer(playerName);
              onClose();
            }}
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
};
export function ConfigureGameForm({
  onConfigurationComplete,
}: ConfigureGameFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [numberOfPlayers, setNumberOfPlayers] =
    useState<number>(DEFAULT_PLAYERS);
  const [revealRole, setRevealRole] = useState(false);
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [playerNames, setPlayerNames] = useState<string[]>([]);

  const calculateInitialImposters = () => {
    const maxAllowed = Math.max(
      MIN_IMPOSTERS_SLIDER,
      Math.floor(DEFAULT_PLAYERS / 4)
    );
    return Math.max(
      MIN_IMPOSTERS_SLIDER,
      Math.min(MIN_IMPOSTERS_SLIDER, maxAllowed)
    );
  };
  const [numberOfImposters, setNumberOfImposters] = useState<number>(
    calculateInitialImposters()
  );

  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    if (CATEGORIES.length > 0 && !selectedCategory) {
      setSelectedCategory(CATEGORIES[0].value);
    }

    const storedConfiguration = localStorage.getItem("gameConfiguration");
    if (storedConfiguration) {
      const parsedConfiguration = JSON.parse(storedConfiguration);
      setSelectedCategory(parsedConfiguration.category || CATEGORIES[0].value);
      setNumberOfPlayers(parsedConfiguration.players || DEFAULT_PLAYERS);
      setNumberOfImposters(
        parsedConfiguration.imposters || calculateInitialImposters()
      );
      setRevealRole(parsedConfiguration.revealEliminatedPlayerRole || false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    const newMaxAllowedImposters = Math.max(
      MIN_IMPOSTERS_SLIDER,
      Math.floor(numberOfPlayers / 4)
    );
    setNumberOfImposters((currentImposters) =>
      Math.max(
        MIN_IMPOSTERS_SLIDER,
        Math.min(currentImposters, newMaxAllowedImposters)
      )
    );
  }, [numberOfPlayers]);

  const handleStartGame = () => {
    if (!selectedCategory) {
      toast({
        title: "Missing Information",
        description: "Please select a game category before starting.",
        variant: "destructive",
      });
      return;
    }
    const gameConfiguration = {
      category: selectedCategory,
      players: numberOfPlayers,
      imposters: numberOfImposters,
      revealEliminatedPlayerRole: revealRole,
    };

    localStorage.setItem(
      "gameConfiguration",
      JSON.stringify(gameConfiguration)
    );

    onConfigurationComplete(gameConfiguration);
  };

  const imposterSliderMaxProp = Math.max(
    MIN_IMPOSTERS_SLIDER,
    Math.floor(numberOfPlayers / 4)
  );

  // Find the currently selected category object to display its label and icon
  const currentCategory = CATEGORIES.find(
    (cat) => cat.value === selectedCategory
  );

  if (!isClient) {
    return (
      <Card className="w-full max-w-lg shadow-2xl rounded-xl">
        <CardHeader className="p-6 md:p-8">
          <CardTitle className="text-3xl md:text-4xl font-headline font-bold text-center text-primary">
            Game Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6 md:p-8">
          <div className="animate-pulse space-y-8">
            <div className="space-y-2">
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-12 bg-muted rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-6 bg-muted rounded w-1/2"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-6 bg-muted rounded w-1/2"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-24 bg-muted/50 rounded-md border border-border"></div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center p-6 md:p-8">
          <Button className="w-full text-lg py-3 h-12" size="lg" disabled>
            Loading Settings...
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg shadow-2xl rounded-xl overflow-hidden">
      <CardHeader className="p-6 md:p-8 bg-primary/5">
        <CardTitle className="text-3xl md:text-4xl font-headline font-bold text-center text-primary">
          Game Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 p-6 md:p-8">
        <div className="space-y-2">
          <Label
            htmlFor="category-select"
            className="text-lg font-medium text-foreground block mb-1"
          >
            Select Category
          </Label>
          {/* START: REFACTORED COMPONENT */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                id="category-select"
                className="w-full text-base h-12 rounded-md justify-between font-normal"
              >
                {currentCategory ? (
                  <div className="flex items-center">
                    {currentCategory.icon}
                    <span>{currentCategory.label}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    Choose a category...
                  </span>
                )}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-72 overflow-y-auto">
              {CATEGORIES.map((cat) => (
                <DropdownMenuItem
                  key={cat.value}
                  className="text-base py-2"
                  onSelect={() => setSelectedCategory(cat.value)}
                >
                  <div className="flex items-center">
                    {cat.icon}
                    <span>{cat.label}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* END: REFACTORED COMPONENT */}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center mb-1">
            <Label
              htmlFor="player-slider"
              className="text-lg font-medium text-foreground flex items-center"
            >
              <Users className="mr-2 h-5 w-5 text-primary" /> Number of Players
            </Label>
            <span className="text-xl font-bold text-primary bg-primary/10 px-3 py-1 rounded-md">
              {numberOfPlayers}
            </span>
          </div>
          <Slider
            id="player-slider"
            min={MIN_PLAYERS}
            max={MAX_PLAYERS}
            step={1}
            value={[numberOfPlayers]}
            onValueChange={(value) => setNumberOfPlayers(value[0])}
            className="my-2 [&>span:first-of-type]:h-3 [&>span:first-of-type_>span]:h-3 [&>span:last-of-type]:h-6 [&>span:last-of-type]:w-6 [&>span:last-of-type]:border-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground px-1">
            <span>{MIN_PLAYERS} players</span>
            <span>{MAX_PLAYERS} players</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center mb-1">
            <Label
              htmlFor="imposter-slider"
              className="text-lg font-medium text-foreground flex items-center"
            >
              <ShieldAlert className="mr-2 h-5 w-5 text-accent" /> Number of
              Imposters
            </Label>
            <span className="text-xl font-bold text-accent bg-accent/10 px-3 py-1 rounded-md">
              {numberOfImposters}
            </span>
          </div>
          <Slider
            id="imposter-slider"
            min={MIN_IMPOSTERS_SLIDER}
            max={imposterSliderMaxProp}
            step={1}
            value={[numberOfImposters]}
            onValueChange={(value) => setNumberOfImposters(value[0])}
            className="my-2 [&>span:first-of-type]:h-3 [&>span:first-of-type_>span]:h-3 [&>span:last-of-type]:h-6 [&>span:last-of-type]:w-6 [&>span:last-of-type]:border-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground px-1">
            <span>
              {MIN_IMPOSTERS_SLIDER} imposter
              {MIN_IMPOSTERS_SLIDER === 1 ? "" : "s"}
            </span>
            <span>
              {imposterSliderMaxProp} imposter
              {imposterSliderMaxProp === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between space-x-3 p-4 bg-muted/10 rounded-lg border border-border/50 shadow-sm">
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-primary" />
            <Label
              htmlFor="reveal-role-switch"
              className="text-base font-medium text-foreground flex flex-col"
            >
              Reveal Eliminated Player's Role?
              <span className="text-xs text-muted-foreground font-normal">
                Shows if player was an Imposter or not.
              </span>
            </Label>
          </div>
          <Switch
            id="reveal-role-switch"
            checked={revealRole}
            onCheckedChange={setRevealRole}
            aria-label="Toggle reveal eliminated player role"
          />
        </div>

        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border shadow-sm">
          <h4 className="text-xl font-headline font-semibold text-center text-primary">
            Current Configuration
          </h4>
          <Separator className="my-2 bg-border/70" />
          <div className="space-y-1 text-center text-base">
            <p className="text-foreground">
              <span className="font-semibold">Category:</span>{" "}
              {CATEGORIES.find((c) => c.value === selectedCategory)?.label ||
                "Not selected"}
            </p>
            <p className="text-foreground">
              <span className="font-semibold">
                Players ({playerNames.length} / {numberOfPlayers}):
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {playerNames.map((name, index) => (
                <div
                  key={index}
                  className="inline-flex items-center rounded-full bg-secondary px-3 py-0.5 text-sm font-medium"
                >
                  <button
                    type="button"
                    className="h-3 w-3 mr-1 rounded-full hover:bg-gray-500 flex items-center justify-center"
                    onClick={() => {
                      const newPlayerNames = [...playerNames];
                      newPlayerNames.splice(index, 1);
                      setPlayerNames(newPlayerNames);
                      setNumberOfPlayers(
                        Math.max(numberOfPlayers - 1, MIN_PLAYERS)
                      );
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {name}
                  <button
                    type="button"
                    className="ml-2 h-4 w-4 rounded-full hover:bg-gray-500 flex items-center justify-center"
                  >
                    <span className="sr-only">Remove</span>
                    <Eye className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <Button
                className="rounded-full px-2 py-1 text-sm bg-primary text-primary-foreground hover:bg-primary/80 min-w-[80px]"
                onClick={() => {
                  setPlayerName("");
                  setIsAddPlayerModalOpen(true);
                }}
              >
                add
              </Button>
            </div>
            <p className="text-foreground">
              <span className="font-semibold">Imposters:</span>{" "}
              {numberOfImposters}
            </p>
            <p className="text-foreground">
              <span className="font-semibold">Reveal Role on Elimination:</span>{" "}
              {revealRole ? "Yes" : "No"}
            </p>
          </div>
        </div>
        <AddPlayerModal
          isOpen={isAddPlayerModalOpen}
          onClose={() => setIsAddPlayerModalOpen(false)}
          onAddPlayer={(playerName) => {
            console.log(`Adding player: ${playerName}`);
            setNumberOfPlayers(Math.min(numberOfPlayers + 1, MAX_PLAYERS));
            setPlayerNames([...playerNames, playerName]);
          }}
        />
      </CardContent>
      <CardFooter className="flex justify-center p-6 md:p-8 border-t border-border bg-muted/20">
        <Button
          onClick={handleStartGame}
          className="w-full text-lg font-semibold py-3 h-12 rounded-md shadow-md hover:shadow-lg transition-shadow"
          size="lg"
        >
          Enter Player Names
        </Button>
      </CardFooter>
    </Card>
  );
}
