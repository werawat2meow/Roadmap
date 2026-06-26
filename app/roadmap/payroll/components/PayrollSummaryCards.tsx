type SummaryCard = {
  title: string;
  value: number;
  color: string;
  textColor: string;
};

type PayrollSummaryCardsProps = {
  cards: SummaryCard[];
};

export default function PayrollSummaryCards({ cards }: PayrollSummaryCardsProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
                <div
                    key={card.title}
                    className={`rounded-[28px] border border-slate-200 p-5 shadow-sm ${card.color}`}
                >
                    <p className="text-sm font-medium text-slate-500">{card.title}</p>
                    <p className={`mt-4 text-3xl font-black ${card.textColor}`}>{card.value}</p>
                </div>
            ))}
        </div>
    );
};