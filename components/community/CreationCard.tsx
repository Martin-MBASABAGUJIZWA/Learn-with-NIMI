import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Share2, Loader2 } from "lucide-react";
import { Creation } from "./types";

interface CreationCardProps {
  creation: Creation;
  onLike: (creationId: string) => Promise<void>;
  onAddComment: (creationId: string, content: string) => Promise<boolean>;
  onShare: (creation: Creation) => void;
  currentUser: { name: string; avatar: string };
}

export const CreationCard = React.memo(({ 
  creation, 
  onLike, 
  onAddComment, 
  onShare,
  currentUser
}: CreationCardProps) => {
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [localComments, setLocalComments] = useState(() => {
    // Initialize comments based on the creation data
    if (typeof creation.comments === 'string' && creation.comments.trim() !== '') {
      return [{
        id: 'initial-comment',
        content: creation.comments,
        author: creation.childName,
        createdAt: creation.createdAt
      }];
    }
    return Array.isArray(creation.comments) ? creation.comments : [];
  });

  const handleLikeClick = async () => {
    try {
      setIsLiking(true);
      await onLike(creation.id);
    } catch (error) {
      console.error("Like error:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
  
    try {
      setIsCommenting(true);
      
      // Add optimistic comment
      const tempComment = {
        id: `temp-${Date.now()}`,
        content: comment,
        author: currentUser.name,
        createdAt: new Date().toISOString()
      };
      setLocalComments(prev => [...prev, tempComment]);
      setComment("");
  
      // Submit to server
      const savedComment = await onAddComment(creation.id, comment);
      
      // Replace temp comment with saved one
      setLocalComments(prev => prev.map(c => 
        c.id === tempComment.id ? savedComment : c
      ));
  
      // Scroll to comment
      setTimeout(() => {
        const commentsContainer = document.getElementById(`comments-${creation.id}`);
        commentsContainer?.scrollTo({
          top: commentsContainer.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
  
    } catch (error) {
      // Remove failed comment
      setLocalComments(prev => prev.filter(c => c.id !== tempComment.id));
      setError("Couldn't add comment. Try again!");
    } finally {
      setIsCommenting(false);
    }
  };
  return (
    <div className="overflow-hidden hover:shadow-lg transition-shadow relative bg-white rounded-lg border">
      {creation.completionStatus === 'completed' && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center z-10">
          <span className="w-3 h-3 mr-1">✨</span>
          Completed!
        </div>
      )}
      
      <div className="relative aspect-square">
        <img 
          src={creation.imageUrl} 
          alt={`Art by ${creation.childName}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">{creation.childName} ({creation.age})</h3>
          <div className="text-xs text-gray-500">
            {new Date(creation.createdAt).toLocaleDateString()}
          </div>
        </div>
        
        {creation.description && (
          <p className="text-sm text-gray-600 mb-3">{creation.description}</p>
        )}
        
        <div className="flex justify-around border-t pt-3">
          <Button 
            variant="ghost" 
            className="flex items-center gap-1" 
            onClick={handleLikeClick}
            disabled={isLiking}
          >
            {isLiking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Heart 
                className="w-5 h-5" 
                fill={creation.likedByUser ? "currentColor" : "none"} 
                color={creation.likedByUser ? "#ec4899" : "currentColor"}
              />
            )}
            <span>{creation.likes}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex items-center gap-1" 
            onClick={() => setShowComments(!showComments)}
            disabled={isCommenting}
          >
            <MessageCircle className="w-5 h-5" />
            <span>{localComments.length}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => onShare(creation)}
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        {showComments && (
          <div id={`comments-${creation.id}`} className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {localComments.length > 0 ? (
              localComments.map((comment, index) => (
                <div key={`comment-${comment.id || index}`} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                    {comment.author?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2 flex-1">
                    <div className="font-medium text-xs">{comment.author || 'Unknown'}</div>
                    <div className="text-sm">{comment.content}</div>
                    {comment.createdAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(comment.createdAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-2">
                No comments yet
              </div>
            )}
            
            <div className="flex gap-2 mt-2 sticky bottom-0 bg-white pt-2">
              <Input
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex-1 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                disabled={isCommenting}
              />
              <Button 
                onClick={handleCommentSubmit}
                disabled={!comment.trim() || isCommenting}
                size="sm"
              >
                {isCommenting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

CreationCard.displayName = "CreationCard";