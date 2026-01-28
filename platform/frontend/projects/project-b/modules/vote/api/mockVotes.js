// modules/vote/api/mockVotes.js

export const mockVotes = [
  {
    id: "v1",
    title: "下季專案代號",
    description: "請票選下季主要專案的代號，方便內部溝通。",
    publisher: "esther",
    allowMultiple: false,
    status: "open",
    rule: { mode: "all", totalVoters: 5, deadline: null },
    votesReceived: 2,
    options: [
      { id: "v1-o1", label: "Aquila", votes: 2, voters: ["robin", "jason"] },
      { id: "v1-o2", label: "Orion", votes: 0, voters: [] },
      { id: "v1-o3", label: "Lyra", votes: 0, voters: [] },
    ],
  },
  {
    id: "v2",
    title: "辦公室座位調整",
    description: "希望大家對座位區偏好提供意見。",
    publisher: "robin",
    allowMultiple: true,
    status: "open",
    rule: { mode: "time", deadline: "2026-01-10T18:00", totalVoters: 0 },
    votesReceived: 3,
    options: [
      { id: "v2-o1", label: "靠窗安靜區", votes: 2, voters: ["esther", "cody"] },
      { id: "v2-o2", label: "協作開放區", votes: 1, voters: ["robin"] },
      { id: "v2-o3", label: "會議室附近", votes: 0, voters: [] },
    ],
  },
  {
    id: "v3",
    title: "年度旅遊地點",
    description: "票選今年的員工旅遊地點，最多可選兩個。",
    publisher: "cody",
    allowMultiple: true,
    status: "closed",
    rule: { mode: "time", deadline: "2025-12-31T12:00", totalVoters: 0 },
    votesReceived: 6,
    options: [
      { id: "v3-o1", label: "沖繩", votes: 2, voters: ["sara", "ruby"] },
      { id: "v3-o2", label: "首爾", votes: 1, voters: ["kelly"] },
      { id: "v3-o3", label: "台東綠島", votes: 3, voters: ["cody", "esther", "robin"] },
    ],
  },
];
