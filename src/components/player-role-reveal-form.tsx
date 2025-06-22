import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, ArrowRight } from "lucide-react";

interface PlayerRoleRevealFormProps {
  playerNames: string[];
  gameOption: string;
  imposterNames: string[];
  onComplete: (playerNames: string[]) => void;
}

export function PlayerRoleRevealForm({ playerNames, gameOption, imposterNames, onComplete }: PlayerRoleRevealFormProps) {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (revealed) {
      timer = setTimeout(() => {
        setRevealed(false);
        if (currentPlayerIndex < playerNames.length - 1) {
          setCurrentPlayerIndex((i) => i + 1);
        } else {
          onComplete(playerNames);
        }
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [revealed, currentPlayerIndex, playerNames, onComplete]);

  const isImposter = imposterNames.includes(playerNames[currentPlayerIndex]);
  const isLastPlayer = currentPlayerIndex === playerNames.length - 1;
  const otherImposters = isImposter
    ? imposterNames.filter((name) => name !== playerNames[currentPlayerIndex])
    : [];

  return (
    <Card className="w-full max-w-lg shadow-2xl rounded-xl overflow-hidden">
      <CardHeader className="p-6 md:p-8 bg-primary/5">
        <CardTitle className="text-3xl md:text-4xl font-headline font-bold text-center text-primary">
          Reveal Role
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground text-base pt-2">
          Player {currentPlayerIndex + 1} of {playerNames.length}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6 md:p-8">
        <div className="space-y-2 text-center">
          <div className="text-lg font-semibold text-foreground mb-2">
            {playerNames[currentPlayerIndex]}
          </div>
          {revealed ? (
            <div className="p-4 bg-accent/20 border border-accent rounded-lg text-center shadow-md">
              <p className="text-sm text-accent-foreground mb-1">
                {isImposter ? "Your Role:" : "Your secret item is:"}
              </p>
              <p className="text-xl font-bold text-accent">{isImposter ? "Imposter" : gameOption}</p>
              {isImposter && otherImposters.length > 0 && (
                <div className="mt-2 text-sm text-accent-foreground">
                  <span className="font-semibold">Other Imposters:</span> {otherImposters.join(", ")}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">(Hides in 3 seconds)</p>
            </div>
          ) : (
            <Button
              className="w-full text-lg font-semibold py-3 h-12 rounded-md shadow-md hover:shadow-lg transition-shadow"
              size="lg"
              onClick={() => setRevealed(true)}
              autoFocus
            >
              Reveal
              {isLastPlayer ? <CheckCircle className="ml-2 h-5 w-5" /> : <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center p-6 md:p-8 border-t border-border bg-muted/20">
        <span className="text-muted-foreground text-sm">
          Pass the device to <span className="font-semibold">{playerNames[currentPlayerIndex]}</span>.
        </span>
      </CardFooter>
    </Card>
  );
} 