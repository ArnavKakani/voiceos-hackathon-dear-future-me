import { PartnerLogoSlot } from '../components/ui/PartnerLogoSlot';
import { DfmIconSlot } from '../components/ui/DfmIconSlot';
import { PageWrapper } from '../components/layout/PageWrapper';
import { motion } from 'framer-motion';

const teamImageModules = import.meta.glob('../assets/team/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,avif,AVIF}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const keyStats = [
  { value: '1,109', label: 'Pre-survey responses', sub: 'from students across 26 schools', accent: 'bg-[#FEE188]/30 border-[#FEE188]' },
  { value: '989', label: 'Post-reflections completed', sub: 'measuring real change over time', accent: 'bg-[#FFD1BD]/30 border-[#FFD1BD]' },
  { value: '720', label: 'Workshop attendees', sub: 'in-person, at school events', accent: 'bg-[#9FD89C]/25 border-[#9FD89C]' },
  { value: '26', label: 'Schools reached', sub: 'our strongest measure of scale', accent: 'bg-[#B7E3FF]/30 border-[#B7E3FF]' },
];

type TeamMember = {
  name: string;
  role: string;
  bio: string;
  key: string;
};

const coFounders: TeamMember[] = [
  {
    name: 'Nikhilesh Suravarjjala',
    role: 'Co-Founder',
    key: 'Nikhilesh',
    bio: "Hey, I'm Nikhilesh Suravarjjala. I've always been drawn to building things that combine innovation with impact, from wildfire detection technologies to digital learning platforms. To me, Dear Future Me is one of those projects close to my heart — the main purpose is so that high schoolers could take time to pause, reflect, and really connect with who they are even during super high-pressure moments. DFM's vision was to create a space where emotional growth and intentional check-ins feel empowering, and I'm proud of how our team has brought that to life.",
  },
  {
    name: 'Tanvi Bharadwaj',
    role: 'Co-Founder',
    key: 'Tanvi',
    bio: "Hi, I'm Tanvi Bharadwaj! I build with purpose, combining my passions for health, tech, and education. What started as a simple letter to myself grew into Dear Future Me, an initiative giving high school students space to explore who they are and what they stand for, beyond college admissions and test scores. I'm proud to have built a community that celebrates each other's achievements, no matter how big or small. Beyond DFM, I build apps to improve health literacy for patients and gamify media literacy for kids. Every project I take on is driven by the same goal: to create tools and experiences that empower people, spark curiosity, and make a real impact.",
  },
  {
    name: 'Suhani Gupta',
    role: 'Co-Founder',
    key: 'Suhani',
    bio: "Hi, I'm Suhani Gupta, a senior at Dublin High School. I've always cared about mental health because I've seen how much academic pressure can affect people, including myself and those around me. Through HOSA, projects like InsightInno with the Dublin Mayor, and other experiences, I've realized how important it is to create spaces where students feel supported beyond academics. That's why I helped start Dear Future Me. To me, this project is about giving students room to breathe, reflect, and remind themselves that who they are matters more than any grade on a transcript.",
  },
];

const teamMembers: TeamMember[] = [
  {
    name: 'Arnav Kakani',
    role: 'DFM Voice Intern',
    key: 'Arnav',
    bio: "Hi, I'm Arnav Kakani. As an intern with Dear Future Me, I helped bring DFM Voice to life so students can capture what they're feeling in the moment, simply by speaking. Having experienced the loss of peers in the Emerald High community, I understand how important it is for young people to have approachable spaces to process, reflect, and feel less alone. I'm grateful to support a tool that makes reaching for that moment of connection a little easier.",
  },
  {
    name: 'Sophia Wang',
    role: 'Team Member',
    key: 'Sophia',
    bio: "Hi, I'm Sophia Wang. There are times when academic and school pressures trigger self-deprecating thoughts that break me down. What I found helpful is remembering and noting the things that make me unique beyond academics, which is why I support Dear Future Me to help others in similar situations. This year, I hope to engage more of our audience by expanding our social media presence with content that brings comfort and stress relief.",
  },
  {
    name: 'Thanh Duong',
    role: 'Team Member',
    key: 'Thanh',
    bio: 'Hi, I’m Thanh Duong! Mental health is something deeply important to me because I’ve seen friends and family struggle with it firsthand. That’s why the project Dear Future Me is a cause I truly care about, as it encourages people to reflect on their growth, recognize their goals, and take the first steps toward improving themselves. I also believe learning healthy coping strategies can make a huge difference during difficult times. Most importantly, this project reminds people that no matter what they are going through, they are never alone.',
  },
];

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findTeamImage(memberKey: string, variant: 'professional' | 'little') {
  const normalizedMemberKey = normalizeKey(memberKey);
  const normalizedVariant = normalizeKey(variant);

  return Object.entries(teamImageModules).find(([path]) => {
    const fileName = path.split('/').pop() ?? '';
    const baseName = fileName.replace(/\.[^.]+$/, '');
    const [rawName, rawVariant] = baseName.split('_');
    return normalizeKey(rawName ?? '') === normalizedMemberKey && normalizeKey(rawVariant ?? '') === normalizedVariant;
  })?.[1];
}

function placeholderImage(label: string, bg: string) {
  return `https://placehold.co/600x760/${bg}/355842?text=${encodeURIComponent(label)}`;
}

function TeamPhotoStack({ memberKey, name }: { memberKey: string; name: string }) {
  const professional = findTeamImage(memberKey, 'professional') ?? placeholderImage(`${name} Professional`, 'f6efe0');
  const little = findTeamImage(memberKey, 'little') ?? placeholderImage(`${name} Little Me`, 'd8efe0');

  return (
    <div className="relative mx-auto mb-6 w-full max-w-[260px]">
      <div className="overflow-hidden rounded-[2rem] border border-[#d4c99a]/60 bg-[#F9F5ED] shadow-[0_16px_34px_rgba(93,142,103,0.12)]">
        <img src={professional} alt={`${name} professional portrait`} className="aspect-[4/5] w-full object-cover" />
      </div>
      <div className="absolute -bottom-4 right-[-8px] w-24 sm:w-28">
        <div className="overflow-hidden rounded-[1.4rem] border-4 border-[#F9F5ED] bg-[#F9F5ED] shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
          <img src={little} alt={`${name} childhood portrait`} className="aspect-square w-full object-cover" />
        </div>
      </div>
    </div>
  );
}

function TeamMemberCard({ person }: { person: TeamMember }) {
  return (
    <motion.div
      className="rounded-[2rem] border border-[#d4c99a]/60 bg-[#FFFDF8] p-6 sm:p-7 shadow-sm"
      variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.45 }}
    >
      <TeamPhotoStack memberKey={person.key} name={person.name} />
      <h4 className="font-comfortaa font-bold text-[#5D8E67] text-xl mb-1">{person.name}</h4>
      <p className="font-comfortaa text-[#9FD89C] font-semibold text-sm mb-4">{person.role}</p>
      <p className="font-comfortaa text-[#5D8E67]/70 text-sm leading-relaxed">{person.bio}</p>
    </motion.div>
  );
}

export function AboutPage() {
  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">

        <div className="text-center mb-16">
          <h1 className="font-comfortaa font-bold text-[#5D8E67] text-4xl sm:text-5xl mb-5 leading-tight">
            About Dear Future Me
          </h1>
          <p className="font-comfortaa text-[#5D8E67]/70 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            We&apos;re on a mission to help young people develop healthy perspectives on achievement,
            stress, and self-worth through reflection and community support.
          </p>
        </div>

        <section className="mb-16">
          <div className="bg-[#F9F5ED] border border-[#d4c99a]/60 rounded-2xl p-8 sm:p-10 text-center shadow-sm">
            <h2 className="font-comfortaa font-bold text-[#5D8E67] text-2xl mb-6">Meet the Founders</h2>
            <p className="font-comfortaa text-[#5D8E67]/80 leading-relaxed text-base sm:text-lg max-w-3xl mx-auto mb-6">
              We started Dear Future Me so that students could pause, reflect, and reconnect with their inner voice
              in the midst of high-pressure academic environments. We wanted to create a space where self-expression,
              emotional growth, and intentional check-ins feel natural and empowering because sometimes, the most
              important person to talk to is your future self.
            </p>
            <p className="font-comfortaa font-semibold text-[#5D8E67] text-sm">
              Nikhilesh Suravarjjala, Tanvi Bharadwaj, and Suhani Gupta
            </p>
          </div>
        </section>

        <section className="mb-16">
          <div className="bg-[#5D8E67] rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-[0.06] pointer-events-none" />
            <p className="font-handwriting text-[#9FD89C]/80 text-lg mb-3">the number that matters most</p>
            <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4">
              <div className="text-center">
                <span className="font-comfortaa font-bold text-[#F9F5ED] text-5xl sm:text-6xl">3.95</span>
                <p className="font-comfortaa text-[#F9F5ED]/60 text-sm mt-1">before</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="font-comfortaa font-bold text-[#FEE188] text-3xl">↓</span>
                <span className="font-handwriting text-[#9FD89C]/80 text-sm">dropped to</span>
              </div>
              <div className="text-center">
                <span className="font-comfortaa font-bold text-[#9FD89C] text-5xl sm:text-6xl">3.32</span>
                <p className="font-comfortaa text-[#F9F5ED]/60 text-sm mt-1">after</p>
              </div>
            </div>
            <p className="font-comfortaa text-[#F9F5ED]/75 text-base max-w-md mx-auto">
              Average self-reported anxiety score measured across 989 student post-reflections.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center justify-center gap-3 mb-2">
            <DfmIconSlot variant="notebook" size="md" />
            <h2 className="font-comfortaa font-bold text-[#5D8E67] text-3xl text-center">Team Bio</h2>
            <DfmIconSlot variant="pencil" size="md" />
          </div>
          <div className="w-16 h-0.5 bg-[#9FD89C] mx-auto mb-10" />

          <h3 className="font-comfortaa font-bold text-[#5D8E67] text-xl text-center mb-10">Co-Founders</h3>
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {coFounders.map((person) => (
              <TeamMemberCard key={person.name} person={person} />
            ))}
          </motion.div>

          <div className="border-t border-[#9FD89C]/30 pt-10">
            <h3 className="font-comfortaa font-bold text-[#5D8E67] text-xl text-center mb-10">Team Members</h3>
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {teamMembers.map((person) => (
                <TeamMemberCard key={person.name} person={person} />
              ))}
            </motion.div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="font-comfortaa font-bold text-[#5D8E67] text-2xl mb-5">
            Why Dear Future Me exists
          </h2>
          <div className="bg-[#FEE188]/25 border-2 border-[#FEE188] rounded-2xl p-6 sm:p-8">
            <p className="font-comfortaa text-[#5D8E67]/80 leading-relaxed mb-4">
              Too many high school students feel like their worth is tied to their GPA, their college admissions results,
              and how they compare to their peers. We surveyed 1,109 students across 26 schools and heard the same story,
              over and over: the pressure to perform is relentless and it is quietly breaking people.
            </p>
            <p className="font-handwriting text-[#5D8E67] text-xl leading-relaxed">
              &quot;We built Dear Future Me because we needed it ourselves.&quot;
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="font-comfortaa font-bold text-[#5D8E67] text-2xl mb-6">Our reach</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {keyStats.map((stat, i) => (
              <div key={i} className={`border-2 rounded-2xl p-5 ${stat.accent}`}>
                <span className="font-comfortaa font-bold text-[#5D8E67] text-3xl">{stat.value}</span>
                <p className="font-comfortaa font-semibold text-[#5D8E67] text-sm mt-1">{stat.label}</p>
                <p className="font-comfortaa text-[#5D8E67]/60 text-xs mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#F9F5ED] border-2 border-[#9FD89C]/40 rounded-2xl p-8">
          <h2 className="font-comfortaa font-bold text-[#5D8E67] text-xl mb-2 text-center">In Collaboration With</h2>
          <p className="font-comfortaa text-[#5D8E67]/65 text-sm mb-8 text-center">
            NeuroHealth Alliance
          </p>
          <div className="flex justify-center">
            <PartnerLogoSlot name="NeuroHealth Alliance" />
          </div>
        </section>

      </div>
    </PageWrapper>
  );
}
