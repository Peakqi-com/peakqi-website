---
slug: ntpc-ai-hackathon-2026-land-appraisal-win
title: "Special report: PeakQi's team AI城市起風 wins the Land Office track at New Taipei's AI Smart City Hackathon"
summary: 71 teams, 5 winners at New Taipei's first AI hackathon. PeakQi's team, entered as AI城市起風, won the Land Office track with an AI-assisted appraisal review system built in 28 hours.
date: 2026-09-24
order: 10
tags:
  - news
  - ai-adoption
cover: /assets/blog/ntpc-ai-hackathon-2026.webp
coverAlt: Award ceremony of the 2026 New Taipei AI Smart City Hackathon — team AI城市起風 on stage with city officials, holding the NT$100,000 Land Office track winner board
updated:
draft: false
---

On 13 September 2026 the final of the *2026 New Taipei City AI Smart City Hackathon* was held at the New Taipei City Hall auditorium. It was the city government's first AI hackathon: the Youth Affairs, Education, Legal Affairs, Transportation and Land Administration departments each set a real front-line problem, Amazon Web Services (AWS) provided the cloud and AI stack, and 71 teams — 245 people from across Taiwan — had 28 hours to build a working solution. One winner was chosen per department, each receiving NT$100,000. **PeakQi's team, entered as "AI城市起風", answered the Land Administration Office's brief — AI-assisted review of real-estate appraisal cases — and won that track.** This special report records what we built in those 28 hours, and the four rules we held to while building it.

## The team: AI城市起風

Hackathon entries are registered as teams. AI城市起風 was made up of three PeakQi members: Jacky Wu (founder and CEO), Allen Hong (COO and head of AI products) and Ting Chia-chi (CTO). PeakQi was founded in 2024 and focuses on AI adoption for small and mid-sized businesses — scoping the need, building the system and iterating after launch, delivered in a forward-deployed engineering (FDE) model, with 30-plus systems shipped. The hackathon was the same people and the same method, with the brief swapped for a government front-line process.

Choosing the Land Office brief was no accident. Jacky studied real estate and spent years in urban renewal coordinating landowners, developers, government and engineers; how appraisal forms get filled in, and where reviewers get stuck, is familiar ground.

![Team AI城市起風 at their desk in the competition hall, team name card on the table](/assets/blog/ntpc-ai-hackathon-2026/team-desk.webp)

## The competition

- **Name**: 2026 New Taipei City AI Smart City Hackathon (first edition)
- **Organiser**: New Taipei City Government — led by the Youth Affairs Department, with briefs from Education, Legal Affairs, Transportation and Land Administration; AWS provided cloud and AI technology
- **Scale**: 71 teams, 245 participants; final and award ceremony 12–13 September 2026, New Taipei City Hall auditorium
- **Format**: 28 hours to build a working solution to a department's brief, deployed on AWS under the competition rules
- **Result**: 5 winning teams, NT$100,000 each; the city said winning solutions will be evaluated by the relevant departments for further use

The five winners and briefs: AI城市起風 (Land Administration — AI-assisted appraisal review), 9月離去時叫醒我 (Transportation — YouBike smart dispatch), TheWeeklyBlend (Youth Affairs — New Taipei youth dashboard), 中之民 (Education — childcare-facility risk early warning), 直接處理 (Legal Affairs — AI-assisted appeals review workbench).

![All finalists and the five winning teams of the 2026 New Taipei AI Smart City Hackathon in the City Hall auditorium](/assets/blog/ntpc-ai-hackathon-2026/all-teams.webp)

## The brief: reviewers compare three forms by hand, every day

The Land Office's brief was specific. Appraisal firms submit a land-value-zone survey sheet, a regional-factor analysis table and a comparison-approach valuation table; reviewers check distances, grades, adjustment rates and totals line by line, by hand. Three pain points: many forms, easy to miss one; the valuation baseline tables differ by land-use type, so readings are inconsistent; adjustment totals and cross-form copying are easy to miscalculate or mis-transcribe.

## What we built

We handed the whole chain — survey facts → grades → adjustment rates → totals → cross-form transcription — to the system, in four steps:

1. **Input**: upload the submitted forms as PDF (scans included), or give a land parcel number only.
2. **Generate**: from map data and rules, the system fills in the survey sheet, the regional-factor table and the comparison-approach table; with no forms and only a parcel number, it produces a first version anyway.
3. **Review**: every cell is recalculated and marked *consistent / needs confirmation / inconsistent*, with the article of the valuation regulations or the manual page it rests on.
4. **Output**: system-format forms, a review opinion, three map plates, and an Excel that writes the values straight back into the Land Office's official templates, cell for cell.

The final-day brief was a residential parcel in Shulin District: four land-value zones, three comparable sales, and the individual-factor section of the comparison table left entirely blank. We uploaded two files — the brief and the valuation baseline schedule — and in about a minute all six pages were filled in. Review result: 0 inconsistent, 2 needing confirmation, 3 notes. The two to confirm were floor-area ratios: after checking both versions of the land-use control rules, the system found that three of the zones should fall under the "frontage road under 8 metres" proviso — it measured the road widths from the urban-plan map itself. Nobody knew the answer in advance.

![A team member of AI城市起風 explaining the system screen to judges and other teams in the competition hall](/assets/blog/ntpc-ai-hackathon-2026/presenting.webp)

## Four rules

We set these four rules for this system, and they are the same ones we apply when helping businesses adopt AI:

1. **Numbers are computed only by the rules engine; the language model never touches a number.** AI is used for scan recognition and polishing the review opinion, with a gate in front of it.
2. **Every formula traces back to its legal basis.** The regulation article or manual page is one click away for the reviewer.
3. **Values the system infers are marked "needs confirmation" — the appraiser is never judged wrong.** The appraiser's value takes precedence; inferred values list their source and reasoning, with an adjustable threshold.
4. **Map data and records live on the host, with no dependence on external services.** Zoning, road network, cadastre and transaction records for all of New Taipei are loaded onto the server; deployment sits in AWS us-west-2 per the competition rules, with only ports 443 and 80 open.

Acceptance was equally direct: we first ran the Land Office's sample case and reproduced every grade, every adjustment rate, all the way to the comparison price of NT$212,958 per square metre — then moved on to the final brief.

## How this relates to what PeakQi does every day

It's the same method. Business clients usually come to us with "one stage of the process stuck in manual comparison and re-typing" — the forms are just LINE conversations, quotes or customer lists instead. Our approach has always been: break the process into checkable steps, let AI draft and flag what a person needs to look at, and have a person approve. It's written up in full on [how we deliver](/en/method); the 28 hours of the hackathon were simply that method, compressed.

The hackathon also confirmed something: government processes are far denser in rules than most businesses, but as long as the rules can be written down, a system can check every cell — and it must let a person trace every number. That is harder than "AI gives you an answer", and more useful. For how we decide whether a process should go to AI at all, see [n8n, packaged SaaS or a custom AI platform](/en/blog/n8n-vs-saas-vs-custom-ai-platform).

![Team AI城市起風 receiving the Land Administration track award on stage](/assets/blog/ntpc-ai-hackathon-2026/receiving.webp)

## What's next

The city said winning solutions will be evaluated by the relevant departments for further use. The competition build already runs the full review chain; a production rollout still needs an official cadastral data source, a host inside the government network, and the Land Office's confirmation of thresholds for inferred values. The system is not yet open for public demonstration; if you work in government, at an appraisal firm or in real estate and would like to know more, [let's set up a time to talk](/en/demo).

## Press coverage (in Chinese)

- United Daily News: [New Taipei's first AI Smart City Hackathon — five teams take NT$100,000 each](https://udn.com/news/story/7323/9752019)
- United Daily News: [Final and award ceremony](https://udn.com/news/story/7323/9752448)
- DIGITIMES: [The New Taipei AI Smart City Hackathon opens](https://www.digitimes.com.tw/tech/dt/n/shwnws.asp?cnlid=13&cat=100&id=0000768340_4K24HAGD3UD0Q11G5HN75)
- DIGITIMES: [The five winning teams and their solutions](https://www.digitimes.com.tw/tech/dt/n/shwnws.asp?CnlID=13&id=769011)
- TVBS News: [New Taipei's first AI Smart City Hackathon](https://news.tvbs.com.tw/politics/4021755)
- The News Lens: [Feature on the New Taipei AI Smart City Hackathon](https://www.thenewslens.com/feature/ntpc2025/270243)
- Storm Media: [Final report](https://www.storm.mg/article/11167457)
- ETtoday: [Five winning teams announced](https://www.ettoday.net/news/20260923/3237860.htm)
- China Daily News (Tainan): [New Taipei's first AI Smart City Hackathon](https://www.cdns.com.tw/articles/1459515)
- Yahoo News Taiwan: [Government sets the problems, AI solves them](https://tw.news.yahoo.com/%E6%94%BF%E5%BA%9C%E5%87%BA%E9%A1%8Cai%E8%A7%A3%E9%A1%8C-%E6%96%B0%E5%8C%97%E5%B8%82ai%E6%99%BA%E6%85%A7%E5%9F%8E%E5%B8%82%E9%BB%91%E5%AE%A2%E6%9D%BE%E7%AB%B6%E8%B3%BD%E7%99%BB%E5%A0%B4-141602437.html)
- Yahoo News Taiwan: [Five teams take NT$100,000 each](https://tw.news.yahoo.com/%E6%96%B0%E5%8C%97%E9%A6%96%E8%BE%A6ai%E6%99%BA%E6%85%A7%E5%9F%8E%E5%B8%82%E9%BB%91%E5%AE%A2%E6%9D%BE-5%E5%9C%98%E9%9A%8A%E5%90%84%E6%8A%B110%E8%90%AC%E5%85%83%E7%8D%8E%E9%87%91-120847946.html)
- LINE TODAY: [Hackathon coverage](https://today.line.me/tw/v3/article/j7Rz6Da)
- life.tw: [Five teams take NT$100,000 each](https://life.tw/article/%E6%96%B0%E5%8C%97%E9%A6%96%E8%BE%A6ai%E6%99%BA%E6%85%A7%E5%9F%8E%E5%B8%82%E9%BB%91%E5%AE%A2%E6%9D%BE-5%E5%9C%98%E9%9A%8A%E5%90%84%E6%8A%B110%E8%90%AC%E5%85%83%E7%8D%8E%E9%87%91-3148073)
- Scoop: [New Taipei's first AI Smart City Hackathon](https://www.scooptw.com/taiwanpost/527104/%E6%96%B0%E5%8C%97%E9%A6%96%E8%BE%A6ai%E6%99%BA%E6%85%A7%E5%9F%8E%E5%B8%82%E9%BB%91%E5%AE%A2%E6%9D%BE%E3%80%805%E5%9C%98%E9%9A%8A%E5%90%84%E6%8A%B110%E8%90%AC%E5%85%83%E7%8D%8E%E9%87%91/)
- Content Platform: [245 AI builders compete at New Taipei's first hackathon](https://www.contentplatform.info/articles/512209/%E6%96%B0%E5%8C%97%E9%A6%96%E5%B1%86%E3%80%8C2026%E6%96%B0%E5%8C%97%E5%B8%82ai%E6%99%BA%E6%85%A7%E5%9F%8E%E5%B8%82%E9%BB%91%E5%AE%A2%E6%9D%BE%E7%AB%B6%E8%B3%BD%E3%80%8D-245%E4%BD%8Dai%E9%AB%98/)

## Common questions

**Q: You built it in 28 hours — how long does a real rollout take?**
The 28 hours were our usual method compressed to the limit, on a clearly bounded brief with data supplied by the organiser. For a business or agency rollout, standard modules can go live in as little as 10 working days; integration with existing systems and custom rules are scoped separately — see [how we deliver](/en/method).

**Q: Can the system be used today?**
The competition build is deployed on AWS under the competition rules and runs all four steps — input, generate, review, output. A production rollout needs three more things: an official cadastral data source (the National Land Surveying and Mapping Center API, or imported cadastral maps), a host inside the government network, and the Land Office's confirmation of how inferred values are thresholded and presented.

**Q: Which AI does it use?**
All numbers come from the rules engine. A language model on Amazon Bedrock is used only for scan recognition and polishing the review opinion, at under one request per second, and takes no part in any calculation.

**Q: Could other cities, or private appraisal firms, use it?**
The valuation baseline tables are data in the system, not hard-coded logic; switching district or land-use type means importing the matching tables and map data. Before any production use, though, the legal basis and manual page references must be checked with the relevant authority — that's our own rule: every number has to click back to its source.

---

*Written by the PeakQi team. Competition facts follow the New Taipei City Government's announcements and the press coverage listed above; the system description reflects the version demonstrated at the final on 13 September 2026. Published 2026-09-24.*
