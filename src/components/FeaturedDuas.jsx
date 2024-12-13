const FeaturedDuas = () => {
  const duas = [
    {
      title: "Dua for Forgiveness",
      text: "اللَّهُمَّ اغْفِرْ لِي ذَنْبِي كُلَّهُ",
      translation: "O Allah, forgive me all of my sins.",
      reference: "Sahih Muslim 2719",
    },
    {
      title: "Dua for Guidance",
      text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
      translation: "Guide us on the Straight Path.",
      reference: "Quran 1:6",
    },
    {
      title: "Dua for Protection",
      text: "اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ وَمِنْ خَلْفِي",
      translation: "O Allah, protect me from in front and behind me.",
      reference: "Sunan Abi Dawood 5074",
    },
  ];

  return (
    <section className="bg-accent text-background py-16 px-3">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-monsterate font-bold text-primary mb-8">
          Featured Duas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {duas.map((dua, index) => (
            <div key={index} className="bg-primary p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-background mb-4">
                {dua.title}
              </h3>
              <p className="text-lg text-background italic mb-2">
                "{dua.text}"
              </p>
              <p className="text-sm text-secondary mb-2">"{dua.translation}"</p>
              <p className="text-xs text-background font-light">
                {dua.reference}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedDuas;
