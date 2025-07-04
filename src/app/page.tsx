"use client";

import { useState, type ReactNode, useEffect } from "react";
import {
  ConfigureGameForm,
  type GameConfiguration,
} from "@/components/configure-game-form";
import { PlayerNameEntryForm } from "@/components/player-name-entry-form";
import { PlayerRoleRevealForm } from "@/components/player-role-reveal-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ShieldAlert, HelpCircle, XCircle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import Confetti from "react-confetti";
import React from "react";

type GameStage = "configuring" | "enteringNames" | "gameReady" | "playingRound";

interface FullGameSettings extends GameConfiguration {
  playerNames: string[];
  gameOption: string;
  imposterNames: string[];
}

interface PlayerStatus {
  name: string;
  isImposter: boolean;
  isEliminated: boolean;
  showRole: boolean;
}

const GAME_OPTIONS_URL =
  "https://gist.githubusercontent.com/pranjalchaplot/92463f2dde1a1b285d23fabf173abd90/raw/ec267fdea7dc500961f012e57528c8c3ac61ec6f/imposter-game.json";

export default function Home() {
  const [currentStage, setCurrentStage] = useState<GameStage>("configuring");
  const [gameConfig, setGameConfig] = useState<GameConfiguration | null>(null);
  const [gameOption, setGameOption] = useState<string | null>(null);
  const [fullGameSettings, setFullGameSettings] =
    useState<FullGameSettings | null>(null);
  const [playerStatuses, setPlayerStatuses] = useState<PlayerStatus[]>([]);
  const { toast } = useToast();
  const [clientRandomValue, setClientRandomValue] = useState<number | null>(
    null
  );
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState<string | null>(null);
  const [windowDimensions, setWindowDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const [fetchedGameOptions, setFetchedGameOptions] = useState<Record<
    string,
    string[]
  > | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // Add ref to access the ConfigureGameForm component
  const configureGameFormRef = React.useRef<{ openAddPlayerModal: () => void }>(null);

  useEffect(() => {
    setClientRandomValue(Math.random());

    function handleResize() {
      if (typeof window !== "undefined") {
        setWindowDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    }
    if (typeof window !== "undefined") {
      handleResize(); // Initial dimensions
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Add keyboard event listener for Ctrl+P
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Ctrl+P is pressed and we're on the configuring stage
      if (event.ctrlKey && event.key === 'p' && currentStage === "configuring") {
        event.preventDefault(); // Prevent default browser behavior
        // Trigger the add player modal
        if (configureGameFormRef.current?.openAddPlayerModal) {
          configureGameFormRef.current.openAddPlayerModal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStage]);

  useEffect(() => {
    async function fetchOptions() {
      setIsLoadingOptions(true);
      setOptionsError(null);
      try {
        const response = await fetch(GAME_OPTIONS_URL);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch game options: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();
        if (typeof data !== "object" || data === null) {
          throw new Error(
            "Fetched game options are not in the expected format."
          );
        }
        setFetchedGameOptions(data);
      } catch (error) {
        console.error("Error fetching game options:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unknown error occurred while fetching options.";
        setOptionsError(errorMessage);
        setFetchedGameOptions({}); // Set to empty to avoid null issues, error will be handled
        toast({
          title: "Error Loading Game Options",
          description: errorMessage,
          variant: "destructive",
          duration: 7000,
        });
      } finally {
        setIsLoadingOptions(false);
      }
    }
    fetchOptions();
  }, [toast]);

  const handleConfigurationComplete = (settings: GameConfiguration) => {
    if (isLoadingOptions) {
      toast({
        title: "Still Loading Options",
        description:
          "Game options are being fetched. Please wait a moment and try again.",
        variant: "default",
      });
      return;
    }

    setGameConfig(settings);
    let selectedOption = "Mystery Item"; // Default

    if (
      optionsError ||
      !fetchedGameOptions ||
      Object.keys(fetchedGameOptions).length === 0
    ) {
      if (!optionsError) {
        // Avoid double toast if fetchOptions already showed one
        toast({
          title: "Game Options Unavailable",
          description:
            optionsError ||
            "Could not load game options. Using a default item.",
          variant: "destructive",
        });
      }
    } else {
      const categoryKey = settings.category.toLowerCase();
      const categoryOptions = fetchedGameOptions[categoryKey];

      if (categoryOptions && categoryOptions.length > 0) {
        const randomIndex = Math.floor(
          (clientRandomValue ?? Math.random()) * categoryOptions.length
        );
        selectedOption = categoryOptions[randomIndex];
      } else {
        // Fallback to any option from any category if the specific one isn't found or is empty
        const allOptions = Object.values(fetchedGameOptions).flat();
        if (allOptions.length > 0) {
          const randomIndex = Math.floor(
            (clientRandomValue ?? Math.random()) * allOptions.length
          );
          selectedOption = allOptions[randomIndex];
          toast({
            title: "Category Options Not Found",
            description: `No options found for '${settings.category}' in the fetched data. Using a general random option.`,
            variant: "default",
            duration: 4000,
          });
        } else {
          toast({
            title: "No Game Options Available",
            description:
              "The fetched game options list is completely empty. Using a default item.",
            variant: "destructive",
          });
        }
      }
    }

    setGameOption(selectedOption);

    setCurrentStage("enteringNames");
    toast({
      title: "Configuration Saved!",
      description: `Next, enter names for ${settings.players} players. ${
        settings.imposters
      } imposter${settings.imposters === 1 ? "" : "s"}. Reveal role: ${
        settings.revealEliminatedPlayerRole ? "Yes" : "No"
      }.`,
    });
  };

  const handlePlayerNamesSubmitted = (playerNames: string[]) => {
    if (gameConfig && gameOption) {
      const finalSettings: FullGameSettings = {
        ...gameConfig,
        playerNames,
        gameOption,
        imposterNames: gameConfig.imposterNames,
      };
      setFullGameSettings(finalSettings);
      setCurrentStage("gameReady");
      toast({
        title: "All Set!",
        description: `Game ready with ${finalSettings.players} players (${
          finalSettings.imposters
        } imposter${finalSettings.imposters === 1 ? "" : "s"}). Category: ${
          finalSettings.category
        }.`,
        duration: 5000,
      });
      console.log("Final game settings:", finalSettings);
    }
  };

  const handleBeginRound = () => {
    if (fullGameSettings) {
      const initialStatuses = fullGameSettings.playerNames.map(
        (name) => ({
          name,
          isImposter: fullGameSettings.imposterNames.includes(name),
          isEliminated: false,
          showRole: false,
        })
      );
      setPlayerStatuses(initialStatuses);
      setIsGameOver(false);
      setGameOverMessage(null);
      setCurrentStage("playingRound");
    }
  };

  const handlePlayerCardClick = (clickedIndex: number) => {
    if (isGameOver || playerStatuses[clickedIndex].isEliminated) return;

    setPlayerStatuses((prevStatuses) =>
      prevStatuses.map((status, index) => {
        if (index === clickedIndex) {
          return {
            ...status,
            isEliminated: true,
            showRole: fullGameSettings?.revealEliminatedPlayerRole
              ? true
              : false,
          };
        }
        return status;
      })
    );
  };

  useEffect(() => {
    if (
      currentStage !== "playingRound" ||
      !fullGameSettings ||
      playerStatuses.length === 0 ||
      isGameOver
    ) {
      return;
    }

    const remainingPlayers = playerStatuses.filter((p) => !p.isEliminated);
    const remainingImposters = remainingPlayers.filter((p) => p.isImposter);
    const remainingNonImposters = remainingPlayers.filter((p) => !p.isImposter);
    const totalInitialImposters = fullGameSettings.imposters;

    let currentGameOverMessage = null;

    if (totalInitialImposters > 0 && remainingImposters.length === 0) {
      currentGameOverMessage =
        "Players Win! All imposters have been eliminated.";
    } else if (
      remainingImposters.length > 0 &&
      remainingImposters.length >= remainingNonImposters.length &&
      remainingNonImposters.length > 0
    ) {
      currentGameOverMessage =
        "Imposters Win! Their numbers match or exceed the loyal players.";
    } else if (
      remainingImposters.length > 0 &&
      remainingNonImposters.length === 0 &&
      totalInitialImposters > 0
    ) {
      currentGameOverMessage =
        "Imposters Win! All loyal players have been eliminated.";
    }

    if (currentGameOverMessage) {
      setIsGameOver(true);
      setGameOverMessage(currentGameOverMessage);
      toast({
        title: "Game Over!",
        description: currentGameOverMessage,
        duration: 7000,
      });
    }
  }, [playerStatuses, currentStage, fullGameSettings, isGameOver, toast]);

  const resetGame = () => {
    setCurrentStage("configuring");
    setGameConfig(null);
    setFullGameSettings(null);
    setGameOption(null);
    setPlayerStatuses([]);
    setIsGameOver(false);
    setGameOverMessage(null);
    setClientRandomValue(Math.random());
    // Optionally re-fetch options or assume they are cached/stable
    // For simplicity, not re-fetching here, but could add if options change frequently
  };

  const renderContent = () => {
    if (clientRandomValue === null && currentStage === "configuring") {
      // Still using clientRandomValue for some client-side only initializations
      return (
        <ConfigureGameForm
          ref={configureGameFormRef}
          onConfigurationComplete={handleConfigurationComplete}
        />
      );
    }
    switch (currentStage) {
      case "configuring":
        return (
          <ConfigureGameForm
            ref={configureGameFormRef}
            onConfigurationComplete={handleConfigurationComplete}
          />
        );
      case "enteringNames":
        if (gameConfig && gameOption) {
          return (
            <PlayerRoleRevealForm
              playerNames={gameConfig.playerNames}
              gameOption={gameOption}
              imposterNames={gameConfig.imposterNames}
              onComplete={handlePlayerNamesSubmitted}
            />
          );
        }
        return <p>Loading player role reveal...</p>;
      case "gameReady":
        return (
          <div className="text-center p-8 bg-card text-card-foreground rounded-xl shadow-2xl max-w-lg w-full">
            <h2 className="text-3xl font-bold text-primary mb-4">
              Game Ready!
            </h2>
            {fullGameSettings && (
              <>
                <p className="text-lg mb-2">
                  Category:{" "}
                  <span className="font-semibold">
                    {fullGameSettings.category}
                  </span>
                </p>
                <p className="text-lg mb-2">
                  Players:{" "}
                  <span className="font-semibold">
                    {fullGameSettings.players}
                  </span>
                </p>
                <p className="text-lg mb-2">
                  Imposters:{" "}
                  <span className="font-semibold">
                    {fullGameSettings.imposters}
                  </span>
                </p>
                <p className="text-lg mb-2">
                  Reveal Eliminated Player's Role:{" "}
                  <span className="font-semibold">
                    {fullGameSettings.revealEliminatedPlayerRole ? "Yes" : "No"}
                  </span>
                </p>
                <p className="text-lg mb-4">Player Roster:</p>
                <ul className="list-disc list-inside mb-6 bg-muted/30 p-4 rounded-md">
                  {fullGameSettings.playerNames.map((name, index) => (
                    <li key={index} className="text-md py-1">
                      {name}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={handleBeginRound}
                  className="w-full text-lg py-3 h-12 rounded-md shadow-md hover:shadow-lg transition-shadow"
                  size="lg"
                >
                  Begin Round
                </Button>
                <Button
                  onClick={resetGame}
                  variant="outline"
                  className="w-full text-md py-3 h-10 rounded-md shadow-sm hover:shadow-md transition-shadow mt-4"
                  size="lg"
                >
                  Configure New Game
                </Button>
              </>
            )}
          </div>
        );
      case "playingRound":
        return (
          <div className="w-full max-w-4xl">
            {isGameOver && windowDimensions && (
              <Confetti
                width={windowDimensions.width}
                height={windowDimensions.height}
                recycle={false}
                numberOfPieces={500}
                gravity={0.15}
              />
            )}
            <h2 className="text-3xl font-bold text-primary mb-2 text-center">
              {isGameOver ? "Game Over" : "Game In Progress..."}
            </h2>
            {isGameOver && gameOverMessage && (
              <p className="text-center text-xl font-semibold text-accent mb-6">
                {gameOverMessage}
              </p>
            )}
            {!isGameOver && (
              <p className="text-center text-muted-foreground mb-6">
                Click on a player to eliminate them.
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              {playerStatuses.map((player, index) => (
                <Card
                  key={index}
                  onClick={() => handlePlayerCardClick(index)}
                  className={cn(
                    "p-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out",
                    isGameOver || player.isEliminated
                      ? "cursor-not-allowed"
                      : "cursor-pointer transform hover:scale-105 hover:shadow-xl",
                    isGameOver
                      ? "opacity-100"
                      : player.isEliminated && !player.showRole
                      ? "opacity-60"
                      : "opacity-100",
                    isGameOver
                      ? player.isImposter
                        ? "bg-red-200 dark:bg-red-800 border-red-500"
                        : "bg-green-200 dark:bg-green-800 border-green-500"
                      : player.isEliminated && player.showRole
                      ? player.isImposter
                        ? "bg-red-200 dark:bg-red-800 border-red-500"
                        : "bg-green-200 dark:bg-green-800 border-green-500"
                      : player.isEliminated
                      ? "bg-muted/50"
                      : "bg-card"
                  )}
                >
                  <CardContent className="flex flex-col items-center justify-center p-2 text-center">
                    <div className="mb-2">
                      {isGameOver ? (
                        player.isImposter ? (
                          <ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-400" />
                        ) : (
                          <User className="h-10 w-10 text-green-600 dark:text-green-400" />
                        )
                      ) : player.isEliminated && player.showRole ? (
                        player.isImposter ? (
                          <ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-400" />
                        ) : (
                          <User className="h-10 w-10 text-green-600 dark:text-green-400" />
                        )
                      ) : player.isEliminated ? (
                        <XCircle className="h-10 w-10 text-muted-foreground" />
                      ) : (
                        <HelpCircle className="h-10 w-10 text-primary" />
                      )}
                    </div>
                    <p
                      className={cn(
                        "font-semibold text-lg truncate w-full",
                        player.isEliminated && !isGameOver && "line-through"
                      )}
                    >
                      {player.name}
                    </p>
                    {(isGameOver ||
                      (player.isEliminated && player.showRole)) && (
                      <p
                        className={cn(
                          "text-sm font-bold mt-1",
                          player.isImposter
                            ? "text-red-700 dark:text-red-300"
                            : "text-green-700 dark:text-green-300"
                        )}
                      >
                        {player.isImposter ? "Imposter" : "Player"}
                      </p>
                    )}
                    {!isGameOver && player.isEliminated && !player.showRole && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Eliminated
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button
              onClick={resetGame}
              className="w-full max-w-md mx-auto text-lg py-3 h-12 rounded-md shadow-md hover:shadow-lg transition-shadow"
              size="lg"
            >
              Configure New Game
            </Button>
          </div>
        );
      default:
        return (
          <ConfigureGameForm
            ref={configureGameFormRef}
            onConfigurationComplete={handleConfigurationComplete}
          />
        );
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary drop-shadow-sm">
          Imposter Syndrome
        </h1>
        <p className="text-muted-foreground mt-2 text-base sm:text-lg">
          {currentStage === "configuring" &&
            (isLoadingOptions
              ? "Loading game options..."
              : "Welcome to the Game Of Lies")}
          {currentStage === "enteringNames" &&
            "Now, let's get the player names."}
          {currentStage === "gameReady" && "Your game is ready to go!"}
          {currentStage === "playingRound" &&
            !isGameOver &&
            "The round has begun. Good luck!"}
          {currentStage === "playingRound" &&
            isGameOver &&
            "The game has ended. See results above!"}
        </p>
      </header>
      {renderContent()}
    </main>
  );
}
