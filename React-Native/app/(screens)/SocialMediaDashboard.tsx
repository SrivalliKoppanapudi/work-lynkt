import React,{useState,useEffect} from "react";
import { View, Text, StyleSheet, TouchableOpacity,Pressable,ScrollView,RefreshControl,FlatList,Modal,Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../constant/Colors";
import { PencilLine } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import CategoryNavigation from "../../component/socialmedia/CategoryNavigation";
import PostCard from "../../component/socialmedia/PostCard";
import { supabase } from "../../lib/Superbase";


import ViewPostModal from "../../component/socialmedia/ViewPostModal";
import TrendingTopicCard from "../../component/socialmedia/TrendingTopicCard";

export default function SocialMediaDashboard ()  {
  const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [posts,setPosts]=useState<any[]>([]);
    const [loading, setLoading] = useState(true)
    const [selectedPost, setSelectedPost] = useState<PostCardProps | null>(null);
const [modalVisible, setModalVisible] = useState(false);
interface PostModalProps {
  post: PostCardProps;
  visible: boolean;
  onClose: () => void;
}
interface PostCardProps {
  postId: string;
  userId: string;
  user: {
    name: string;
    role: string;
    avatar: string;
    time: string;
  };
  content: string;
  images: string[];
  stats: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
}
      const handleRefresh = async () => {
    setRefreshing(true);
    // await loadAllData();
    const { data, error } = await supabase
    .from('posts')
    .select('*') // or your specific fields
    .order('created_at', { ascending: false });

  if (!error) setPosts(data);
    
    setRefreshing(false);
  };

 


  const postData = [
  {
    id: "1",
    user: {
      name: "Saras Jamie",
      role: "Math teacher",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      time: "43 min ago",
    },
    content:
      "Lorem ipsum dolor sit amet consectetur. Sit feugiat et sed adipiscing condimentum. In amet feugiat phasellus viverra neque ligula fusce condimentum odio Lorem ipsum dolor sit amet consectetur. Sit…",
    images: [
      "https://images.unsplash.com/photo-1588776814546-3f82d6e1f2d5",
      "https://images.unsplash.com/photo-1616627787217-c4ef37f3e1fa",
    ],
    stats: {
      likes: 343,
      comments: 15,
      shares: 40,
      saves: 1,
    },
  },
  {
    id: "2",
    user: {
      name: "Ravi Mehta",
      role: "Physics Expert",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      time: "1 hr ago",
    },
    content:
      "Just wrapped up a new lesson plan on Quantum Mechanics. 🚀 Excited to share it with my students!",
    images: [
      "https://images.unsplash.com/photo-1581093588401-b8d888d1f5e8",
      "https://images.unsplash.com/photo-1557683316-973673baf926",
    ],
    stats: {
      likes: 215,
      comments: 12,
      shares: 22,
      saves: 4,
    },
  },
];


 const trendingTopics = [
  {
    id:"dea",
    header: "Make Labs session interesting",
    subHeader: "Lab safety Polls",
    description:
      "Lorem ipsum dolor sit amet consectetur. Sit feugiat et sed adipiscing condimentum. In amet feugiat phasellus viverra neque ligula fusce condime",
    buttonText: "Join Community",
    onPress: () => console.log("Joined Community"),
  },
  {
    id:"math",
    
    header: "Math Educator",
    subHeader: "New Geometry Lesson Plan",
    description:
      "Lorem ipsum dolor sit amet consectetur. Sit feugiat et sed adipiscing condimentum. In amet feugiat phasellus viverra neque ligula fusce condime",
    buttonText: "Join Group",
    onPress: () => console.log("Joined Math Group"),
  },
  {
    id:"dsa",
    header: "Event Alert",
    subHeader: "Regional education Conference",
    description:
      "Lorem ipsum dolor sit amet consectetur. Sit feugiat et sed adipiscing condimentum. In amet feugiat phasellus viverra neque ligula fusce condime",
    buttonText: "Register Now",
    onPress: () => console.log("Registered for Event"),
  },
  {
    id:"yugyg",
    header: "STEM Circle",
    subHeader: "Innovative Project Ideas",
    description:
      "Collaborate with STEM mentors and peers to explore hands-on ideas in labs and workshops. Drive creativity through teamwork.",
    buttonText: "Join Circle",
    onPress: () => console.log("Joined STEM Circle"),
  },
];

useEffect(() => {
  if (!modalVisible && selectedPost !== null) {
    fetchPosts(); // Refresh posts
    setSelectedPost(null); // Clear selected post to prevent stale data
  }
}, [modalVisible]);


 
    const fetchPosts = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching posts:', error.message)
        setLoading(false)
        return
      }

      const formattedPosts: any[] = data.map((post: any) => ({
        postId: post.id,
        userId: post.user_id,
        user: {
          name: post.user_name,
          role: post.user_role,
          avatar: post.user_avatar,
          time: timeSince(post.created_at),
        },
        content: post.content,
        images: post.media_urls || [],
        stats: {
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          saves: post.saves || 0,
        },
      }))

      setPosts(formattedPosts)
      setLoading(false)
    }

  useEffect(() => {
  fetchPosts();
}, []);


  // Helper to convert ISO time to "time ago"
  const timeSince = (createdAt: string): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }



  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
              style={styles.scrollView}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
            >
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : (
                <>
                {/* top heading & nav */}
                  <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                    <Pressable
                      onPress={() => router.replace('/(screens)/Home')}
                      style={styles.backButton}
                    >
                      <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
                    </Pressable>
                    <Text style={styles.headerText}>Social Media</Text>
                  </View>
                    {/* horizontal scroll for navigating through feed,messages,...*/}
                    <CategoryNavigation />

                  {/* create post */}
                <View>
                      <Text style={styles.heading}>Share to your network</Text>
                  <View style={styles.containerCreate}>
      <Text style={styles.promptText}>What's on your mind?</Text>
      

      
      <TouchableOpacity onPress={() => router.replace("/socialmedia/CreatePost")}>
        <LinearGradient
          colors={["#00B4DB", "#0083B0"]}
          style={styles.button}
        >
            <PencilLine size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.buttonText}>Create Post</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
                </View>
                  {/* trending topics */}
                 
                            <View >
                              <Text style={styles.heading} >Trending topics</Text>
                              {trendingTopics.length > 0 ? (
                                <FlatList
                                  data={trendingTopics}
                                  renderItem={({ item }) => (
                                    <TrendingTopicCard
                                      
                                        header={item.header}
                                        subHeader={item.subHeader}
                                        description={item.description}
                                        buttonText={item.buttonText}
                                        onPress={item.onPress}
                                    />
                                  )}
                                  keyExtractor={(item) => item.id}
                                  horizontal // Set horizontal to true
                                  showsHorizontalScrollIndicator={true}
                                  // Hide scroll indicator
                                  contentContainerStyle={{ paddingHorizontal: 8 }} // Add padding for better spacing
                                />
                              ) : (
                                <Text >No Trending topics available.</Text>
                              )}
                            </View>

                            {/* user posts */}
                            {loading?(<Text style={styles.heading}>Loading posts...</Text>):(
                              posts.map((item) => (
                              <TouchableOpacity key={item.postId}  onPress={() => {
    setSelectedPost(item); // send entire post object
    setModalVisible(true);
  }}>
                                <PostCard
                              postId={item.postId}
          
          userId={item.userId}
          user={item.user}
          content={item.content}
          images={item.images}
          stats={item.stats}
        />
                              </TouchableOpacity>))

                            )}
                            {selectedPost && (
  <ViewPostModal
    modalVisible={modalVisible}
    setModalVisible={setModalVisible}
    selectedPost={selectedPost}
  />
)}
                            
                            
                  </>
                  ) }
                        </ScrollView>
                      </SafeAreaView> 
  );
}




const styles=StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE,
      },
      scrollView: {
        flex: 1,
        padding: 16,
      },
      headerText: {
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 16,
          color: Colors.PRIMARY,
          marginLeft: 10,
        },
        errorContainer: {
          padding: 20,
          backgroundColor: "#ffeeee",
          borderRadius: 8,
          marginVertical: 10,
        },
        errorText: {
          color: Colors.ERROR,
          fontSize: 16,
        },
         backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  heading:{
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 6,
  },
    containerCreate: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    margin: 12,
    alignItems: "flex-start",
  },
  promptText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  subText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
  },
  button: {
    flexDirection: "row",
    backgroundColor: "#007bff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
})