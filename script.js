async function getTeams() {

    const output = document.getElementById("output");
    output.style.display = "block";
    output.innerHTML = "Carregando...";
    try {

        const res = await fetch(
            "https://development-internship-api.geopostenergy.com/WorldCup/GetAllTeams",
            {
                method: "GET",
                headers: {
                    "git-user": "beatrizsctaveira"
                }
            }
        );

        if (!res.ok) throw new Error("Erro na API");

        const dados = await res.json();

        // ✅ MAPA NOME -> TOKEN
        const mapaTimes = {};
        dados.forEach(t => {
            mapaTimes[t.nome] = t.token;
        });

        const teams = [...dados].sort(() => Math.random() - 0.5);

        const grupos = ["A", "B", "C", "D", "E", "F", "G", "H"];
        let classificados = {};
        let html = "<h2>Fase de Grupos</h2>";

        grupos.forEach((grupo, index) => {

            const grupoTimes = teams.slice(index * 4, index * 4 + 4);
            let tabela = {};

            grupoTimes.forEach(t => {
                tabela[t.nome] = { pontos: 0, gf: 0, ga: 0 };
            });

            html += `<div class="group"><div class="group-title">Grupo ${grupo}</div>`;

            for (let i = 0; i < grupoTimes.length; i++) {
                for (let j = i + 1; j < grupoTimes.length; j++) {

                    let a = grupoTimes[i];
                    let b = grupoTimes[j];

                    let g1 = Math.floor(Math.random() * 5);
                    let g2 = Math.floor(Math.random() * 5);

                    tabela[a.nome].gf += g1;
                    tabela[a.nome].ga += g2;
                    tabela[b.nome].gf += g2;
                    tabela[b.nome].ga += g1;

                    if (g1 > g2) tabela[a.nome].pontos += 3;
                    else if (g2 > g1) tabela[b.nome].pontos += 3;
                    else {
                        tabela[a.nome].pontos += 1;
                        tabela[b.nome].pontos += 1;
                    }

                    html += `<div class="match">
                        ${a.nome} <span class="score">${g1} x ${g2}</span> ${b.nome}
                    </div>`;
                }
            }

            const ranking = Object.keys(tabela).sort((a, b) => {
                const A = tabela[a];
                const B = tabela[b];
                const saldoA = A.gf - A.ga;
                const saldoB = B.gf - B.ga;

                if (B.pontos !== A.pontos) return B.pontos - A.pontos;
                if (saldoB !== saldoA) return saldoB - saldoA;
                return Math.random() - 0.5;
            });

            html += `<div class="table"><b>Classificação</b><br>`;

            ranking.forEach((t, i) => {
                const d = tabela[t];
                const saldo = d.gf - d.ga;

                html += `
                <div class="team-row">
                    <span>${i + 1}. ${t}</span>
                    <span>${d.pontos} pts | SG: ${saldo}</span>
                </div>`;
            });

            html += `</div>`;

            classificados[grupo] = {
                primeiro: ranking[0],
                segundo: ranking[1]
            };

            html += `<div class="classified">
                ✔ ${ranking[0]} e ${ranking[1]}
            </div></div>`;
        });

        // ✅ FUNÇÃO JOGO ATUALIZADA
        function jogo(a, b) {
            let g1 = Math.floor(Math.random() * 5);
            let g2 = Math.floor(Math.random() * 5);

            let p1 = 0;
            let p2 = 0;

            let texto = `${a} ${g1} x ${g2} ${b}`;

            if (g1 === g2) {
                p1 = Math.floor(Math.random() * 5) + 1;
                p2 = Math.floor(Math.random() * 5) + 1;

                while (p1 === p2) p2 = Math.floor(Math.random() * 5) + 1;

                texto += ` (Pênaltis: ${p1} x ${p2})`;
            }

            return {
                vencedor: g1 > g2 || (g1 === g2 && p1 > p2) ? a : b,
                texto,
                g1,
                g2,
                p1,
                p2,
                timeA: a,
                timeB: b
            };
        }

        function fase(lista) {
            let vencedores = [];
            let jogos = [];

            for (let i = 0; i < lista.length; i += 2) {
                let partida = jogo(lista[i], lista[i + 1]);
                vencedores.push(partida.vencedor);
                jogos.push(partida.texto);
            }

            return { vencedores, jogos };
        }

        let oitavas = [
            classificados["A"].primeiro, classificados["B"].segundo,
            classificados["C"].primeiro, classificados["D"].segundo,
            classificados["E"].primeiro, classificados["F"].segundo,
            classificados["G"].primeiro, classificados["H"].segundo,
            classificados["B"].primeiro, classificados["A"].segundo,
            classificados["D"].primeiro, classificados["C"].segundo,
            classificados["F"].primeiro, classificados["E"].segundo,
            classificados["H"].primeiro, classificados["G"].segundo
        ];

        let oitavasRes = fase(oitavas);

        let jogosOitavasEsq = oitavasRes.jogos.slice(0, 4);
        let jogosOitavasDir = oitavasRes.jogos.slice(4, 8);

        let quartasEsqRes = fase(oitavasRes.vencedores.slice(0, 4));
        let quartasDirRes = fase(oitavasRes.vencedores.slice(4, 8));

        let semi1 = jogo(quartasEsqRes.vencedores[0], quartasEsqRes.vencedores[1]);
        let semi2 = jogo(quartasDirRes.vencedores[0], quartasDirRes.vencedores[1]);

        let final = jogo(semi1.vencedor, semi2.vencedor);

        // ✅ POST CORRETO
        await fetch(
            "https://development-internship-api.geopostenergy.com/WorldCup/FinalResult",
            {
                method: "POST",
                headers: {
                    "git-user": "beatrizsctaveira",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    equipeA: mapaTimes[final.timeA],
                    equipeB: mapaTimes[final.timeB],
                    golsEquipeA: final.g1,
                    golsEquipeB: final.g2,
                    golsPenaltyTimeA: final.p1,
                    golsPenaltyTimeB: final.p2
                })
            });

        html += `
<div class="bracket">

    <!-- ESQUERDA -->
    <div class="round">
        <div class="round-title">Oitavas</div>
        ${jogosOitavasEsq.map(t => `<div class="match-box">${t}</div>`).join("")}
    </div>

    <div class="round">
        <div class="round-title">Quartas</div>
        ${quartasEsqRes.jogos.map(t => `<div class="match-box">${t}</div>`).join("")}
    </div>

    <div class="round">
        <div class="round-title">Semifinal</div>
        <div class="match-box">${semi1.texto}</div>
    </div>

    <!-- FINAL -->
    <div class="round final-column">
        <div class="round-title">FINAL</div>
        <div class="match-box">${final.texto}</div>

        <div class="champion-name">
            🏆 Campeão: ${final.vencedor}
        </div>
    </div>

    <!-- DIREITA -->
    <div class="round right">
        <div class="round-title">Semifinal</div>
        <div class="match-box">${semi2.texto}</div>
    </div>

    <div class="round right">
        <div class="round-title">Quartas</div>
        ${quartasDirRes.jogos.map(t => `<div class="match-box">${t}</div>`).join("")}
    </div>

    <div class="round right">
        <div class="round-title">Oitavas</div>
        ${jogosOitavasDir.map(t => `<div class="match-box">${t}</div>`).join("")}
    </div>

</div>
`;



        output.innerHTML = html;

    } catch (err) {
        console.error(err);
        output.innerHTML = "Erro ao carregar dados";
    }
}