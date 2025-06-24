import React,{useState,useEffect} from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert
} from "react-native";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  UserPlus,
  MoreVertical,
  
} from "lucide-react-native";
import { supabase } from "../../lib/Superbase";
// import Share from 'react-native-share';
import { Ionicons } from '@expo/vector-icons';



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

const PostCard = ({ postId,userId,user, content, images, stats }: PostCardProps) => {
  const [liked, setLiked] = useState(false);
const [saved, setSaved] = useState(false);
const [likeCount, setLikeCount] = useState(stats.likes);
const [saveCount, setSaveCount] = useState(stats.saves);
const [modalVisible, setModalVisible] = useState(false);


const checkLikeSaveStatus = async () => {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId || authError) return;

  try {
    // Run both queries in parallel
    const [likeRes, saveRes] = await Promise.all([
      supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .single(),

      supabase
        .from("post_saves")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .single(),
    ]);

    setLiked(!!likeRes.data);
    setSaved(!!saveRes.data);
  } catch (error) {
    console.error("Error checking like/save status:", error);
  }
};


const checkLikeStatus = async () => {
  const { data } = await supabase
    .from("post_likes")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .single();
  if (data) setLiked(true);
};

const checkSaveStatus = async () => {
  const { data } = await supabase
    .from("post_saves")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .single();
  if (data) setSaved(true);
};

useEffect(() => {
  /* checkLikeStatus();
  checkSaveStatus(); */
  checkLikeSaveStatus();
}, []);



const toggleSave = async () => {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return;

  let newCount = saveCount;

  if (saved) {
    await supabase
      .from("post_saves")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    newCount = saveCount - 1;
  } else {
    await supabase
      .from("post_saves")
      .insert([{ post_id: postId, user_id: userId }]);

    newCount = saveCount + 1;
  }
  if(newCount < 0) {newCount = 0;}

  // Update post stats
  await supabase
    .from("posts")
    .update({ saves: newCount })
    .eq("id", postId);

  setSaveCount(newCount);
  setSaved(!saved);
};

const toggleLike = async () => {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return;

  let newCount = likeCount;

  if (liked) {
    await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    newCount = likeCount - 1;
  } else {
    await supabase
      .from("post_likes")
      .insert([{ post_id: postId, user_id: userId }]);

    newCount = likeCount + 1;
  }
  if(newCount < 0) {newCount = 0;}

 const { error } = await supabase
    .from("posts")
    .update({ likes: newCount })
    .eq("id", postId); // make sure this matches your schema

  if (error) {
    console.error("Failed to update like count:", error.message);
    return;
  }
 

  setLikeCount(newCount);
  setLiked(!liked);
};


/* share */
const postUrl = 'https://example.com/post/preview';

const shareOptions = {
    title: 'Check this out!',
    message: 'Here’s a post you might like:',
     url: postUrl,
  };




  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.role}>{user.role}</Text>
            <Text style={styles.role}>{user.time}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.followButton}>
            <UserPlus size={16} color="white" />
            <Text style={styles.followText}>Follow</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ paddingLeft: 10 }}>
            <MoreVertical size={20} color="#444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Post Text */}
      <Text style={styles.contentText}>{content}</Text>

      {/* Post Images */}
      <FlatList
        data={images}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={styles.postImage} />
        )}
        contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
        showsHorizontalScrollIndicator={false}
      />

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statItem} onPress={toggleLike}>
    <Heart size={18} color={liked ? "red" : "#444"} fill={liked ? "red" : "none"} />
    <Text style={styles.statText}>{likeCount}</Text>
  </TouchableOpacity>
        <View style={styles.statItem}>
          <MessageCircle size={18} color="#444" />
          <Text style={styles.statText}>{stats.comments}</Text>
        </View>
        {/* <View style={styles.statItem}>
          <Share2 size={18} color="#444" />
          <Text style={styles.statText}>{stats.shares} </Text>
        </View> */}
        <View>
      {/* Share Button */}
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.statItem}>
        <Share2 size={18} color="#444" />
        <Text style={styles.statText}>{stats.shares}</Text>
      </TouchableOpacity>

      {/* Modal for Share Options */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share via</Text>

            <TouchableOpacity onPress={()=>Alert.alert("will be implemented")} style={styles.shareButton}>
              
<Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              <Text style={styles.shareText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={()=>Alert.alert("will be implemented")} style={styles.shareButton}>
         
              
<Ionicons name="logo-facebook" size={24} color="#1877F2" />

              <Text style={styles.shareText}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={()=>Alert.alert("will be implemented")} style={styles.shareButton}>
              <Share2 size={20} color="#444" />
              <Text style={styles.shareText}>More...</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
        <TouchableOpacity style={styles.statItem} onPress={toggleSave}>
    <Bookmark size={18} color={saved ? "#2e9df7" : "#444"} fill={saved ? "#2e9df7" : "none"} />
    <Text style={styles.statText}>{saveCount}</Text>
  </TouchableOpacity>
      </View>
    </View>
  );
};

export default PostCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginVertical: 10,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  name: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
  },
  role: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  followButton: {
    backgroundColor: "#2e9df7",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  followText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
    marginLeft: 4,
  },
  contentText: {
    marginTop: 12,
    fontSize: 14,
    color: "#333",
  },
  postImage: {
    width: 160,
    height: 140,
    borderRadius: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  statText: {
    fontSize: 13,
    color: "#444",
  },
 
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  shareText: {
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: 'red',
  },
});
