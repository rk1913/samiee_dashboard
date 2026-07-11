import { prisma } from "./db";

export async function ensureDbInitialized() {
  try {
    // 1. Seed Settings (Singleton)
    const settingsCount = await prisma.settings.count();
    if (settingsCount === 0) {
      await prisma.settings.create({
        data: {
          id: "singleton",
          githubUsername: "rk1913",
          leetcodeUsername: "rk1913",
          waterTarget: 8,
        },
      });
      console.log("Seeded default settings with username rk1913.");
    }

    // 2. Check if the Deep Learning track needs updating to the better version
    const dlTrack = await prisma.roadmapTrack.findUnique({
      where: { slug: "deep-learning" },
      include: {
        _count: {
          select: { nodes: true },
        },
      },
    });

    const targetDlNodeCount = 11;
    const needsReseed = !dlTrack || dlTrack._count.nodes !== targetDlNodeCount;

    if (needsReseed) {
      console.log("Deep Learning roadmap nodes updated. Reseeding roadmap tracks...");
      
      // Safe wipe for roadmap data (does not affect Settings or DailyLog)
      await prisma.roadmapNode.deleteMany({});
      await prisma.roadmapTrack.deleteMany({});

      // AI Engineering
      const aiTrack = await prisma.roadmapTrack.create({
        data: {
          name: "AI Engineering",
          slug: "ai-engineering",
          order: 1,
        },
      });

      const aiNodes = [
        { title: "LLM Fundamentals", status: "done", order: 1, notes: "Tokens, Context Window, Prompt Engineering, Embeddings, Chunking, Vector Databases, Retrieval, Hybrid Search, Reranking, Memory, Evaluation. Project: Advanced Production RAG" },
        { title: "Manual AI Framework", status: "in_progress", order: 2, notes: "HTTP APIs, JSON, Manual LLM Client, Prompt Builder, Embedding Client, Retriever, Memory, RAG Engine. Project: Build Your Own Mini LangChain" },
        { title: "LangChain", status: "not_started", order: 3, notes: "Prompt Templates, Chains, LCEL, Retrievers, Memory, Tools, Output Parsers. Project: Production PDF Chatbot" },
        { title: "LangGraph", status: "not_started", order: 4, notes: "State, Nodes, Edges, Conditional Routing, Checkpointing, Persistence. Project: Multi-Step Research Agent" },
        { title: "AI Agents", status: "not_started", order: 5, notes: "Planning, Reflection, Tool Calling, Multi-Agent Systems, Long-Term Memory. Project: AI Research Agent" },
        { title: "MCP (Model Context Protocol)", status: "not_started", order: 6, notes: "MCP Clients, MCP Servers, Tool Registration, Resources. Project: Desktop AI Assistant" },
        { title: "FastAPI", status: "not_started", order: 7, notes: "REST APIs, Async, Authentication, File Uploads, Background Tasks. Project: Serve Your AI Agent as an API" },
        { title: "Databases", status: "not_started", order: 8, notes: "PostgreSQL, MongoDB, Redis. Project: AI Chat Application with User Accounts & Chat History" },
        { title: "Docker", status: "not_started", order: 9, notes: "Docker, Docker Compose. Project: Containerize Your AI Application" },
        { title: "Cloud Deployment", status: "not_started", order: 10, notes: "AWS / GCP, Environment Variables, Object Storage, Basic Monitoring. Project: Deploy Your AI App Publicly" },
        { title: "Production AI Engineering", status: "not_started", order: 11, notes: "Logging, Monitoring, Evaluation, Prompt Versioning, Cost Optimization, Caching, Rate Limiting. Project: Production-Ready AI Assistant" },
        { title: "Fine-Tuning", status: "not_started", order: 12, notes: "Hugging Face, LoRA, QLoRA, PEFT, Instruction Tuning. Project: Fine-Tune an Open-Source LLM" },
        { title: "LLM Optimization", status: "not_started", order: 13, notes: "Quantization, vLLM, TensorRT-LLM, KV Cache, Speculative Decoding. Project: Optimized Local LLM Server" },
        { title: "Advanced AI Systems", status: "not_started", order: 14, notes: "Multi-Agent Architectures, Distributed AI Systems, Agent Observability, Human-in-the-Loop Workflows. Final Flagship Project: Enterprise AI Platform" },
      ];

      for (const node of aiNodes) {
        await prisma.roadmapNode.create({
          data: {
            trackId: aiTrack.id,
            title: node.title,
            status: node.status,
            order: node.order,
            notes: node.notes,
          },
        });
      }

      // Improved Deep Learning Roadmap (11 granular nodes)
      const dlTrackNew = await prisma.roadmapTrack.create({
        data: {
          name: "Deep Learning",
          slug: "deep-learning",
          order: 2,
        },
      });

      const dlNodes = [
        { title: "Mathematics for Deep Learning", status: "not_started", order: 1, notes: "Linear Algebra, Calculus, Probability, and Statistics essentials (matrices, derivatives, chain rule)." },
        { title: "Perceptron & Multi-Layer Perceptrons", status: "not_started", order: 2, notes: "Single-layer perceptron, Feedforward networks (MLP), activation functions (Sigmoid, ReLU, Tanh)." },
        { title: "Training & Optimization", status: "not_started", order: 3, notes: "Loss functions (MSE, Cross-Entropy), Gradient Descent, manual Backpropagation derivation." },
        { title: "PyTorch & Autograd", status: "in_progress", order: 4, notes: "PyTorch tensors, computational graphs, manual Autograd engine (Micrograd). Project: Neural Network from Scratch (Micrograd)." },
        { title: "Regularization & Advanced Optimizers", status: "not_started", order: 5, notes: "Overfitting, L1/L2, Dropout, Batch Norm. SGD, Momentum, RMSprop, Adam." },
        { title: "Convolutional Neural Networks", status: "not_started", order: 6, notes: "Convolutions, pooling, stride, building a CNN from scratch." },
        { title: "CNN Architectures & Transfer Learning", status: "not_started", order: 7, notes: "AlexNet, VGG, ResNet. Fine-tuning pre-trained models. Project: Cats vs Dogs Classifier." },
        { title: "Recurrent Neural Networks", status: "not_started", order: 8, notes: "Sequential data, RNN cell, Backpropagation Through Time (BPTT), vanishing gradients." },
        { title: "LSTMs & GRUs", status: "not_started", order: 9, notes: "Gated networks, cell state, LSTM/GRU cell mechanics. Project: Sentiment Analysis." },
        { title: "Seq2Seq & Attention", status: "not_started", order: 10, notes: "Encoder-Decoder architectures, the bottleneck problem, Bahdanau Attention." },
        { title: "Transformer Architecture", status: "not_started", order: 11, notes: "Self-attention, Multi-head attention, Positional Encoding, Encoder/Decoder blocks. Project: Implement a Mini Transformer in PyTorch." },
      ];

      for (const node of dlNodes) {
        await prisma.roadmapNode.create({
          data: {
            trackId: dlTrackNew.id,
            title: node.title,
            status: node.status,
            order: node.order,
            notes: node.notes,
          },
        });
      }

      // DSA (from level 0)
      const dsaTrack = await prisma.roadmapTrack.create({
        data: {
          name: "DSA",
          slug: "dsa",
          order: 3,
        },
      });

      const dsaNodes = [
        { title: "Arrays & Hashing", status: "not_started", order: 1, notes: "Time/Space Complexity, Array operations, HashMaps, HashSets. (e.g. Contains Duplicate, Two Sum)" },
        { title: "Two Pointers", status: "not_started", order: 2, notes: "Traversal from both ends, middle-out. (e.g. Valid Palindrome, 3Sum)" },
        { title: "Sliding Window", status: "not_started", order: 3, notes: "Subarrays, fixed and dynamic window size. (e.g. Best Time to Buy and Sell Stock)" },
        { title: "Stack", status: "not_started", order: 4, notes: "LIFO operations, monotonic stack. (e.g. Valid Parentheses)" },
        { title: "Binary Search", status: "not_started", order: 5, notes: "Searching sorted space, log(n) complexity. (e.g. Search in Rotated Sorted Array)" },
        { title: "Linked List", status: "not_started", order: 6, notes: "Pointers, singly and doubly linked list manipulation. (e.g. Reverse Linked List)" },
        { title: "Trees & BST", status: "not_started", order: 7, notes: "Recursion, BFS, DFS, traversal methods. (e.g. Invert Binary Tree)" },
        { title: "Heap / Priority Queue", status: "not_started", order: 8, notes: "Min/Max heap, top K elements. (e.g. Kth Largest Element)" },
        { title: "Backtracking", status: "not_started", order: 9, notes: "Recursion, state exploration and pruning. (e.g. Subsets, Permutations)" },
        { title: "Graphs", status: "not_started", order: 10, notes: "DFS/BFS, topological sort, cycle detection. (e.g. Number of Islands, Course Schedule)" },
        { title: "Dynamic Programming", status: "not_started", order: 11, notes: "Memoization, tabulation, subproblems. (e.g. Climb Stairs, Longest Common Subsequence)" },
        { title: "Greedy & Intervals", status: "not_started", order: 12, notes: "Local optimal choices, merging intervals. (e.g. Jump Game, Merge Intervals)" },
      ];

      for (const node of dsaNodes) {
        await prisma.roadmapNode.create({
          data: {
            trackId: dsaTrack.id,
            title: node.title,
            status: node.status,
            order: node.order,
            notes: node.notes,
          },
        });
      }

    }

    // 3. Seed default custom requirements if none exist
    const customReqsCount = await prisma.customRequirement.count();
    if (customReqsCount === 0) {
      await prisma.customRequirement.createMany({
        data: [
          {
            name: "Gym",
            type: "boolean",
            targetVal: 1,
            required: true,
          },
          {
            name: "Reading Pages",
            type: "numeric",
            targetVal: 10,
            required: false,
          },
          {
            name: "Water Glasses",
            type: "numeric",
            targetVal: 8,
            required: false,
          },
        ],
      });
      console.log("Seeded default custom requirements (Gym, Reading, Water).");
    }
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}
